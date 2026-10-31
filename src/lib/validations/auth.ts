import { z } from "zod";

/**
 * Authentication password policy requirements:
 * 1. Must be greater than 8 characters (min 9 characters; 8 or fewer rejected)
 * 2. Must contain at least one uppercase letter (A-Z)
 * 3. Must contain at least one lowercase letter (a-z)
 * 4. Must contain at least one special character
 */
export const PASSWORD_MIN_LENGTH = 9;

export interface PasswordRuleChecks {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasSpecial: boolean;
}

export function checkPasswordComplexity(password: string): PasswordRuleChecks {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };
}

export function validatePasswordRules(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const checks = checkPasswordComplexity(password);
  const errors: string[] = [];

  if (!checks.minLength) {
    errors.push("Password must be at least 9 characters long (8 or fewer characters rejected).");
  }
  if (!checks.hasUpper) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!checks.hasLower) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!checks.hasSpecial) {
    errors.push("Password must contain at least one special character.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "Password must be at least 9 characters long (8 or fewer characters rejected)")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, "Password must contain at least one special character");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters"),
    companyName: z.string().trim().min(2, "Company name must be at least 2 characters"),
    email: z.string().trim().email("Please enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
