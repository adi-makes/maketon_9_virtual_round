import { createClient } from "@/lib/supabase/server";
import { calculateInvoiceTotals } from "./calculator";
import type { BillingRunResult } from "@/types";

/**
 * Executes a recurring billing cycle run.
 * Discovers active subscriptions due for renewal, calculates item totals,
 * prevents duplicate billing for the period, and generates invoices.
 * Maintained by Member 3.
 */
export async function runBillingCycle(): Promise<BillingRunResult> {
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Query active subscriptions due for billing
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      customer_id,
      start_date,
      next_billing_date,
      plan_id,
      plans (
        id,
        name,
        billing_frequency,
        products (
          id,
          name,
          base_price
        )
      ),
      subscription_items (
        id,
        quantity,
        unit_price,
        variant_id,
        product_variants (
          id,
          name,
          price_adjustment
        )
      )
    `
    )
    .eq("status", "active");

  if (subError || !subscriptions) {
    return {
      invoicesCreated: 0,
      duplicatesAvoided: 0,
      failuresCount: 1,
      details: subError ? subError.message : "Failed to load subscriptions.",
    };
  }

  let invoicesCreated = 0;
  let duplicatesAvoided = 0;

  for (const sub of subscriptions as any[]) {
    // Check if subscription has nextBillingDate <= now or start_date <= now
    const periodStart = sub.next_billing_date
      ? new Date(sub.next_billing_date)
      : new Date(sub.start_date);

    if (periodStart > now) {
      continue; // Not yet due
    }

    const periodEnd = new Date(periodStart);
    if (sub.plans?.billing_frequency === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const periodStartIso = periodStart.toISOString();
    const periodEndIso = periodEnd.toISOString();

    // 2. Check for existing invoice for this period (Duplicate Billing Protection)
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("subscription_id", sub.id)
      .eq("billing_period_start", periodStartIso)
      .eq("billing_period_end", periodEndIso)
      .maybeSingle();

    if (existingInvoice) {
      duplicatesAvoided++;
      continue;
    }

    // 3. Calculate line items
    const items = sub.subscription_items || [];
    const lineItems = items.map((item: any) => {
      const base = Number(sub.plans?.products?.base_price || 0);
      const adjustment = Number(item.product_variants?.price_adjustment || 0);
      const unitPrice = Number(item.unit_price) || base + adjustment;
      const quantity = Number(item.quantity) || 1;
      return {
        description: `${sub.plans?.products?.name || "Product"} (${item.product_variants?.name || "Standard"})`,
        quantity,
        unitPrice,
        amount: unitPrice * quantity,
      };
    });

    const calc = calculateInvoiceTotals(lineItems, 0, 18);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const dueDate = new Date(periodStart);
    dueDate.setDate(dueDate.getDate() + 15);

    // 4. Insert invoice
    const { data: newInvoice, error: invError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        subscription_id: sub.id,
        customer_id: sub.customer_id,
        billing_period_start: periodStartIso,
        billing_period_end: periodEndIso,
        due_date: dueDate.toISOString(),
        subtotal: calc.subtotal,
        discount_amount: calc.discountAmount,
        tax_amount: calc.taxAmount,
        total_amount: calc.totalAmount,
        paid_amount: 0,
        outstanding_balance: calc.totalAmount,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (invError) {
      // Caught unique constraint error
      if (invError.code === "23505") {
        duplicatesAvoided++;
      }
      continue;
    }

    // 5. Insert invoice line items
    if (newInvoice && lineItems.length > 0) {
      await supabase.from("invoice_items").insert(
        lineItems.map((li: any) => ({
          invoice_id: newInvoice.id,
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unitPrice,
          amount: li.amount,
        }))
      );
    }

    // 6. Advance subscription next billing date
    await supabase
      .from("subscriptions")
      .update({
        next_billing_date: periodEndIso,
        current_period_start: periodStartIso,
        current_period_end: periodEndIso,
        updated_at: nowIso,
      })
      .eq("id", sub.id);

    invoicesCreated++;
  }

  return {
    invoicesCreated,
    duplicatesAvoided,
    failuresCount: 0,
    details: `Processed ${subscriptions.length} subscriptions. Invoices generated: ${invoicesCreated}. Duplicate attempts prevented: ${duplicatesAvoided}.`,
  };
}
