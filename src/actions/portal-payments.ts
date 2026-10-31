"use server";

/**
 * Customer portal payment action.
 *
 * Security model:
 * - Server action verifies the calling user's customer_id matches the invoice's
 *   customer_id before delegating to recordPayment().
 * - RLS on the invoices and payments tables provides a second layer of protection.
 * - Payments are simulated (no real payment gateway). Amount is fixed to the
 *   full outstanding balance so customers cannot enter arbitrary values.
 *
 * Maintained by Member 3.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordPayment } from "@/lib/billing/payment-service";
import type { ActionResponse } from "@/types";

export interface PortalPayResult extends ActionResponse {
  invoiceId?: string;
  newBalance?: number;
}

/**
 * Allows a logged-in customer to pay the full outstanding balance of one of
 * their own invoices (simulated payment — no real gateway).
 *
 * @param invoiceId  UUID of the invoice to pay
 */
export async function portalPayInvoiceAction(
  invoiceId: string
): Promise<PortalPayResult> {
  if (!invoiceId) {
    return { success: false, error: "Invoice ID is required." };
  }

  try {
    const supabase = await createClient();

    // 1. Identify the calling user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in to make a payment." };
    }

    // 2. Look up the customer record linked to this user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.customer_id) {
      return {
        success: false,
        error:
          "No customer account is linked to your profile. Contact support.",
      };
    }

    const customerId = profile.customer_id as string;

    // 3. Fetch the invoice and verify it belongs to this customer
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("id, customer_id, outstanding_balance, status")
      .eq("id", invoiceId)
      .single();

    if (invError || !invoice) {
      return { success: false, error: "Invoice not found." };
    }

    // Security check: invoice must belong to the authenticated customer
    if (invoice.customer_id !== customerId) {
      return {
        success: false,
        error: "You are not authorised to pay this invoice.",
      };
    }

    // 4. Validate payability
    if (invoice.status === "cancelled") {
      return { success: false, error: "This invoice has been cancelled." };
    }

    const balance = Number(invoice.outstanding_balance) || 0;
    if (balance <= 0) {
      return { success: false, error: "This invoice has already been paid in full." };
    }

    // 5. Record a simulated full payment
    const result = await recordPayment({
      invoiceId,
      amount: balance,
      method: "manual_entry", // simulated — no real payment gateway
      reference: `PORTAL-SIM-${Date.now()}`,
    });

    if (result.success) {
      revalidatePath("/portal");
      revalidatePath("/invoices");
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath("/payments");
      revalidatePath("/dashboard");
    }

    return {
      ...result,
      invoiceId,
      newBalance: result.success ? 0 : balance,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return { success: false, error: message };
  }
}
