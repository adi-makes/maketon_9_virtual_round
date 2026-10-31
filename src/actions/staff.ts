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

    // 3. Obtain privileged admin client with SUPABASE_SECRET_KEY
    const adminClient = getAdminClient();

    // Check caller's role from public.profiles or user_metadata
    const dbForAuth = adminClient || supabase;
    const { data: callerProfile } = await dbForAuth
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
 * Uses privileged admin client to bypass RLS recursion, and reconciles
 * with Supabase Auth users to ensure all team operators are accurately returned.
 */
export async function getStaffMembers(): Promise<StaffProfile[]> {
  try {
    const adminClient = getAdminClient();
    const db = adminClient || (await createClient());

    const { data: profileRows, error } = await db
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .in("role", ["admin", "staff"])
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Notice: profiles query error:", error.message);
    }

    // Map of auth users for metadata reconciliation and self-healing
    const authStaffMap = new Map<
      string,
      { id: string; email: string; fullName?: string; role: UserRole; createdAt: string }
    >();

    if (adminClient) {
      try {
        const { data: authData } = await adminClient.auth.admin.listUsers();
        if (authData?.users) {
          for (const u of authData.users) {
            const email = u.email?.toLowerCase() || "";
            const roleMeta = u.user_metadata?.role as UserRole | undefined;
            const role: UserRole | undefined =
              roleMeta === "admin" || email.startsWith("admin@")
                ? "admin"
                : roleMeta === "staff" || email.startsWith("staff@")
                  ? "staff"
                  : undefined;

            if (role === "admin" || role === "staff") {
              authStaffMap.set(u.id, {
                id: u.id,
                email: u.email || "",
                fullName: u.user_metadata?.full_name,
                role,
                createdAt: u.created_at,
              });
            }
          }
        }
      } catch (authErr) {
        console.warn("Notice: could not list auth users:", authErr);
      }
    }

    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const staffList: StaffProfile[] = [];

    // 1. Process records found in public.profiles
    for (const p of profileRows || []) {
      seenIds.add(p.id);
      if (p.email) seenEmails.add(p.email.toLowerCase());

      const authUser = authStaffMap.get(p.id);

      // Clean up display name
      let name = p.full_name?.trim() || null;
      if (!name || name.toLowerCase() === "admin" || name.toLowerCase() === "staff") {
        if (authUser?.fullName) {
          name = authUser.fullName;
        } else if (p.role === "admin" || p.email?.toLowerCase().startsWith("admin@")) {
          name = "System Administrator";
        } else if (p.role === "staff") {
          name = "Staff Operator";
        }
      }

      staffList.push({
        id: p.id,
        email: p.email || authUser?.email || "unknown@subscriptiq.com",
        fullName: name,
        role: (p.role as UserRole) || authUser?.role || "staff",
        createdAt: p.created_at || authUser?.createdAt || new Date().toISOString(),
      });
    }

    // 2. Self-healing: include any staff/admin present in Auth but missing in public.profiles
    for (const [id, u] of Array.from(authStaffMap.entries())) {
      if (!seenIds.has(id) && u.email && !seenEmails.has(u.email.toLowerCase())) {
        const name =
          u.fullName || (u.role === "admin" ? "System Administrator" : "Staff Operator");

        staffList.push({
          id,
          email: u.email,
          fullName: name,
          role: u.role,
          createdAt: u.createdAt,
        });

        // Insert missing record into public.profiles in background
        if (adminClient) {
          adminClient
            .from("profiles")
            .upsert({
              id,
              email: u.email,
              full_name: name,
              role: u.role,
              updated_at: new Date().toISOString(),
            })
            .then(() => {});
        }
      }
    }

    // Sort by creation date descending
    return staffList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error("Error fetching staff members:", err);
    return [];
  }
}
