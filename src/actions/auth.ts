"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { registerSchema, resetPasswordSchema, type RegisterInput } from "@/lib/validations/auth";
import type { ActionResponse } from "@/types";

/**
 * Registers a new customer account, creating their auth credentials, customer record, and profile.
 */
export async function registerCustomerAction(
  input: RegisterInput
): Promise<ActionResponse<{ userId: string }>> {
  try {
    // 1. Strict schema validation (password length > 8, upper, lower, special, match)
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid registration data.",
      };
    }

    const { name, companyName, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const admin = getAdminClient();

    // 2. Check for existing customer email
    if (admin) {
      const { data: existingCustomer } = await admin
        .from("customers")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingCustomer) {
        return {
          success: false,
          error: "Registration rejected: An account with this email already exists.",
        };
      }

      // Check auth users list as well
      const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const emailExists = userList?.users?.some(
        (u) => u.email?.toLowerCase().trim() === normalizedEmail
      );

      if (emailExists) {
        return {
          success: false,
          error: "Registration rejected: An account with this email already exists.",
        };
      }

      // 3. Create Auth user with verified status
      const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: "customer",
          full_name: name,
          company_name: companyName,
        },
      });

      if (authErr || !authUser?.user) {
        return {
          success: false,
          error: authErr?.message || "Registration rejected: Failed to create user credentials.",
        };
      }

      // 4. Create customer record in public.customers
      const { data: customerRow, error: custErr } = await admin
        .from("customers")
        .insert({
          name,
          email: normalizedEmail,
          company_name: companyName,
          billing_address: {},
        })
        .select("id")
        .single();

      if (custErr || !customerRow) {
        // Rollback created auth user
        await admin.auth.admin.deleteUser(authUser.user.id);
        return {
          success: false,
          error: `Registration failed: ${custErr?.message || "Could not create customer profile."}`,
        };
      }

      // 5. Link user profile
      await admin.from("profiles").upsert({
        id: authUser.user.id,
        email: normalizedEmail,
        full_name: name,
        role: "customer",
        customer_id: customerRow.id,
      });

      return {
        success: true,
        message: "Account created successfully. You can now sign in.",
        data: { userId: authUser.user.id },
      };
    }

    // Fallback if admin secret is not set
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          role: "customer",
          full_name: name,
          company_name: companyName,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("exists")) {
        return {
          success: false,
          error: "Registration rejected: An account with this email already exists.",
        };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
      data: { userId: data.user?.id || "" },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal registration error.";
    return { success: false, error: message };
  }
}

/**
 * Sends a password reset recovery link to the registered email address.
 */
export async function sendPasswordResetEmailAction(
  email: string,
  origin: string
): Promise<ActionResponse> {
  try {
    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const supabase = await createClient();
    const redirectTo = `${origin}/auth/callback?next=/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Reset link sent to registered email.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error occurred.";
    return { success: false, error: message };
  }
}

/**
 * Updates the user's password once authenticated through the reset link session.
 */
export async function updatePasswordAction(
  formData: { password: string; confirmPassword: string }
): Promise<ActionResponse> {
  try {
    const parsed = resetPasswordSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid password requirements.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Password updated successfully.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error occurred.";
    return { success: false, error: message };
  }
}
