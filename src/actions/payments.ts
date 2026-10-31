"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResponse, PaymentMethod } from "@/types";

/**
 * Records an incoming payment against an invoice and recalculates balance.
 * Maintained by Member 3.
 */
export async function recordPaymentAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const invoiceId = formData.get("invoiceId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const method = (formData.get("method") as PaymentMethod) || "manual_entry";
    const reference = (formData.get("reference") as string) || null;

    if (!invoiceId || isNaN(amount) || amount <= 0) {
      return {
        success: false,
        error: "Valid invoice ID and positive amount required.",
      };
    }

    // 1. Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, total_amount, paid_amount, customer_id")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: "Invoice not found." };
    }

    const currentPaid = Number(invoice.paid_amount || 0);
    const total = Number(invoice.total_amount || 0);
    const newPaidAmount = currentPaid + amount;
    const newOutstanding = Math.max(0, total - newPaidAmount);
    const newStatus = newOutstanding === 0 ? "paid" : "partially_paid";
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;

    // 2. Insert payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      payment_number: paymentNumber,
      invoice_id: invoiceId,
      customer_id: invoice.customer_id,
      amount,
      method,
      reference,
      status: "completed",
    });

    if (paymentError) {
      return { success: false, error: paymentError.message };
    }

    // 3. Update invoice balance and status
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        paid_amount: newPaidAmount,
        outstanding_balance: newOutstanding,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return {
      success: true,
      message: `Payment of ₹${amount} recorded successfully.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}
