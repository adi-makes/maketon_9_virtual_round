/**
 * Discount Engine and Promotional Code Validator for SubscriptIQ.
 */

import { createClient } from "@/lib/supabase/server";
import type { DiscountSpecification } from "./calculations";

export interface DiscountValidationResult {
  valid: boolean;
  message?: string;
  discount?: DiscountSpecification;
  code?: string;
}

/**
 * Validates a discount code against the database.
 * Checks for:
 * 1. Existence and casing
 * 2. Active status (is_active = true)
 * 3. Expiration date (valid_until > now)
 */
export async function validateDiscountCode(
  code: string
): Promise<DiscountValidationResult> {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return { valid: false, message: "Discount code cannot be empty." };
  }

  try {
    const supabase = await createClient();
    const { data: discount, error } = await supabase
      .from("discounts")
      .select("code, discount_percent, fixed_amount, is_active, valid_until")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (error || !discount) {
      return {
        valid: false,
        message: `Discount code "${normalizedCode}" is not recognized.`,
      };
    }

    if (!discount.is_active) {
      return {
        valid: false,
        message: `Discount code "${normalizedCode}" is inactive or disabled.`,
      };
    }

    if (discount.valid_until) {
      const expiry = new Date(discount.valid_until);
      if (expiry < new Date()) {
        return {
          valid: false,
          message: `Discount code "${normalizedCode}" expired on ${expiry.toLocaleDateString("en-IN")}.`,
        };
      }
    }

    let spec: DiscountSpecification;
    if (discount.discount_percent && Number(discount.discount_percent) > 0) {
      spec = {
        type: "percentage",
        value: Number(discount.discount_percent),
      };
    } else if (discount.fixed_amount && Number(discount.fixed_amount) > 0) {
      spec = {
        type: "fixed",
        value: Number(discount.fixed_amount),
      };
    } else {
      return {
        valid: false,
        message: `Discount code "${normalizedCode}" has no valid discount value configured.`,
      };
    }

    return {
      valid: true,
      code: normalizedCode,
      discount: spec,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Validation error";
    return { valid: false, message: msg };
  }
}
