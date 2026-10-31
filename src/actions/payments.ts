"use server";

import { revalidatePath } from "next/cache";
import { recordPayment } from "@/lib/billing/payment-service";
import type { ActionResponse, PaymentMethod } from "@/types";

/**
 * Server action to record an incoming payment against an invoice.
 * Validates invoice status, balance boundaries, and ensures atomic update.
 * Maintained by Member 3.
 */
export async function recordPaymentAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const invoiceId = formData.get("invoiceId") as string;
    const rawAmount = formData.get("amount") as string;
    const method = (formData.get("method") as PaymentMethod) || "manual_entry";
    const reference = (formData.get("reference") as string) || null;

    if (!invoiceId) {
      return { success: false, error: "Invoice selection is required." };
    }

    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "A positive payment amount is required." };
    }

    const result = await recordPayment({
      invoiceId,
      amount,
      method,
      reference,
    });

    if (result.success) {
      revalidatePath("/invoices");
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath("/payments");
      revalidatePath("/dashboard");
    }

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}
