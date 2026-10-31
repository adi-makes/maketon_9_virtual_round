/**
 * Discount Engine and Promotional Code Validator for SubscriptIQ.
 *
 * Validates codes against: existence, active status, expiry, and usage caps.
 * Usage cap enforcement uses the atomic DB function claim_discount_redemption()
 * to handle concurrent redemption attempts safely.
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
 *
 * Checks:
 * 1. Existence and normalised casing
 * 2. Active status (is_active = true)
 * 3. Expiration date (valid_until > now)
 * 4. Usage limit (times_redeemed < max_redemptions, or unlimited if NULL)
 *
 * Does NOT claim a redemption slot. Call `claimDiscountRedemption()` when the
 * invoice is actually confirmed to atomically increment times_redeemed.
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
      .select(
        "code, discount_percent, fixed_amount, is_active, valid_until, max_redemptions, times_redeemed"
      )
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

    // Check usage cap (read-only; actual atomic claim happens at invoice confirmation)
    if (
      discount.max_redemptions !== null &&
      discount.times_redeemed >= discount.max_redemptions
    ) {
      return {
        valid: false,
        message: `Discount code "${normalizedCode}" has reached its maximum redemption limit.`,
      };
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

/**
 * Atomically claims one redemption slot for the given discount code.
 *
 * Uses the PostgreSQL function claim_discount_redemption() which performs
 * a SELECT FOR UPDATE + conditional UPDATE inside a single transaction,
 * making it safe for concurrent redemption requests.
 *
 * Returns true if the slot was successfully claimed (or the code is unlimited).
 * Returns false if the code is exhausted or not found.
 *
 * Call this only when finalising an invoice that uses this discount code.
 */
export async function claimDiscountRedemption(code: string): Promise<boolean> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return false;

  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any).rpc("claim_discount_redemption", {
      p_code: normalizedCode,
    });

    if (error) {
      console.error("[claimDiscountRedemption] RPC error:", error.message);
      return false;
    }

    return data === true;
  } catch (err: unknown) {
    console.error(
      "[claimDiscountRedemption] Unexpected error:",
      err instanceof Error ? err.message : err
    );
    return false;
  }
}
