"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import type { ActionResponse, UserRole } from "@/types";

const createStaffSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export interface StaffProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
}

/**
 * Server Action: Create a new Staff operator account directly from the Admin Portal.
 * Admins can only provision Staff Operator accounts; creating Admins is strictly disallowed.
 */
export async function createStaffMember(
  input: CreateStaffInput
): Promise<ActionResponse<StaffProfile>> {
  try {
    // 1. Validate input payload
    const parsed = createStaffSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input data";
      return { success: false, error: firstError };
    }

    const { fullName, email, password } = parsed.data;
    const role: UserRole = "staff";

    // 2. Verify caller has admin privileges
    const supabase = await createClient();
    const {
      data: { user: callerUser },
      error: callerAuthError,
    } = await supabase.auth.getUser();

    if (callerAuthError || !callerUser) {
      return {
        success: false,
        error: "Authentication required. Please log in as an administrator.",
      };
    }

    // Check caller's role from public.profiles or user_metadata
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .single();

    const callerRole =
      callerProfile?.role ||
      callerUser.user_metadata?.role ||
      (callerUser.email?.toLowerCase().startsWith("admin@") ? "admin" : "staff");

    if (callerRole !== "admin") {
      return {
        success: false,
        error: "Forbidden: Only users with the 'admin' role can create staff accounts.",
      };
    }

    // 3. Obtain privileged admin client with SUPABASE_SECRET_KEY
    const adminClient = getAdminClient();
    if (!adminClient) {
      return {
        success: false,
        error:
          "SUPABASE_SECRET_KEY is missing in .env.local. Please add the Supabase service_role key to allow administrative user creation.",
      };
    }

    // 4. Provision user in Supabase Auth (with email pre-confirmed)
    const { data: authResult, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role,
          full_name: fullName,
        },
      });

    if (createError || !authResult.user) {
      return {
        success: false,
        error: createError?.message || "Failed to create user account in Supabase.",
      };
    }

    const createdUserId = authResult.user.id;

    // 5. Explicitly upsert profile in public.profiles
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: createdUserId,
        email,
        full_name: fullName,
        role,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.warn("Notice: public.profiles upsert warning:", profileError.message);
    }

    // 6. Revalidate relevant paths
    revalidatePath("/staff");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Staff operator "${fullName}" (${email}) created successfully.`,
      data: {
        id: createdUserId,
        email,
        fullName,
        role,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "An unexpected server error occurred.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Fetch all team members (Admins and Staff) for the management table.
 */
export async function getStaffMembers(): Promise<StaffProfile[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .in("role", ["admin", "staff"])
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      role: p.role as UserRole,
      createdAt: p.created_at,
    }));
  } catch (err) {
    console.error("Error fetching staff members:", err);
    return [];
  }
}
