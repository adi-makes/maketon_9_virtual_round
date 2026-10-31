"use server";

import { revalidatePath } from "next/cache";
import {
  generateInvoiceForSubscription,
  confirmInvoice,
  cancelInvoice,
} from "@/lib/billing/invoice-service";
import { runBillingCycle } from "@/lib/billing/generator";
import type { ActionResponse, BillingRunResult } from "@/types";

/**
 * Server action to generate an invoice for a specific subscription.
 */
export async function generateInvoiceAction(
  subscriptionId: string,
  options?: { discountCode?: string }
): Promise<ActionResponse<{ invoiceId: string; invoiceNumber: string; totalAmount: number }>> {
  try {
    const result = await generateInvoiceForSubscription(subscriptionId, options);
    if (!result.success || !result.data) {
      return { success: false, error: result.error || "Failed to generate invoice." };
    }

    revalidatePath("/invoices");
    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subscriptionId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: result.message,
      data: {
        invoiceId: result.data.invoiceId,
        invoiceNumber: result.data.invoiceNumber,
        totalAmount: result.data.totalAmount,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: msg };
  }
}

/**
 * Server action to confirm a draft invoice.
 */
export async function confirmInvoiceAction(invoiceId: string): Promise<ActionResponse> {
  try {
    const result = await confirmInvoice(invoiceId);
    if (result.success) {
      revalidatePath("/invoices");
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath("/dashboard");
    }
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: msg };
  }
}

/**
 * Server action to cancel an invoice.
 */
export async function cancelInvoiceAction(invoiceId: string): Promise<ActionResponse> {
  try {
    const result = await cancelInvoice(invoiceId);
    if (result.success) {
      revalidatePath("/invoices");
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath("/dashboard");
    }
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: msg };
  }
}

/**
 * Server action to execute the recurring automated billing cycle.
 */
export async function runBillingCycleAction(): Promise<ActionResponse<BillingRunResult>> {
  try {
    const result = await runBillingCycle();
    revalidatePath("/invoices");
    revalidatePath("/payments");
    revalidatePath("/subscriptions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: result.details,
      data: result,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Billing run execution failed.";
    return { success: false, error: msg };
  }
}
