/**
 * Automated Recurring Billing Cycle Engine for SubscriptIQ.
 * Maintained by Member 3 (Financial & Invoicing Engine Lead).
 * 
 * Discovers active subscriptions due for billing, prevents duplicate invoices
 * for identical billing periods, calculates taxes and line items, and updates
 * subscription renewal schedules.
 */

import { createClient } from "@/lib/supabase/server";
import { calculateInvoice, type LineItemInput } from "./calculations";
import { getActiveTaxRules } from "./tax-service";
import type { BillingRunResult } from "@/types";

function generateRunInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `INV-${year}-${rand}`;
}

export async function runBillingCycle(): Promise<BillingRunResult> {
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Query active subscriptions due for billing
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select(`
      id,
      customer_id,
      status,
      start_date,
      current_period_start,
      current_period_end,
      next_billing_date,
      cancel_at_period_end,
      plan:plans (
        id,
        name,
        billing_frequency,
        interval_count,
        product:products (
          id,
          name,
          base_price
        )
      ),
      items:subscription_items (
        id,
        quantity,
        unit_price,
        variant_id,
        variant:product_variants (
          id,
          name,
          price_adjustment
        )
      )
    `)
    .eq("status", "active");

  if (subError || !subscriptions) {
    return {
      invoicesCreated: 0,
      duplicatesAvoided: 0,
      failuresCount: 1,
      details: subError ? subError.message : "Failed to load active subscriptions.",
    };
  }

  let invoicesCreated = 0;
  let duplicatesAvoided = 0;
  let failuresCount = 0;
  const taxRules = await getActiveTaxRules();

  for (const sub of subscriptions as any[]) {
    try {
      const plan = sub.plan;
      const frequency = plan?.billing_frequency || "monthly";
      const intervalCount = plan?.interval_count || 1;

      // Determine period start
      const periodStart = sub.next_billing_date
        ? new Date(sub.next_billing_date)
        : sub.current_period_start
        ? new Date(sub.current_period_start)
        : new Date(sub.start_date);

      // Skip if future billing date (not yet due)
      if (periodStart > now) {
        continue;
      }

      // Compute period end
      const periodEnd = new Date(periodStart.getTime());
      const count = Math.max(1, intervalCount);
      if (frequency === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + count);
      } else if (frequency === "weekly") {
        periodEnd.setDate(periodEnd.getDate() + count * 7);
      } else if (frequency === "daily") {
        periodEnd.setDate(periodEnd.getDate() + count);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + count);
      }

      const periodStartIso = periodStart.toISOString();
      const periodEndIso = periodEnd.toISOString();

      // 2. Duplicate Billing Protection Pre-check
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

      // 3. Prepare Line Items
      const subItems = (sub.items as any[]) || [];
      const lineItemInputs: LineItemInput[] = [];

      if (subItems.length > 0) {
        for (const item of subItems) {
          const base = Number(plan?.product?.base_price || 0);
          const adjustment = Number(item.variant?.price_adjustment || 0);
          const unitPrice = Number(item.unit_price) || Math.max(0, base + adjustment);
          const quantity = Math.max(1, Number(item.quantity) || 1);

          lineItemInputs.push({
            description: `${plan?.product?.name || "Service"} (${item.variant?.name || "Standard"})`,
            quantity,
            unitPrice,
          });
        }
      } else {
        lineItemInputs.push({
          description: `${plan?.name || "Subscription"} (${plan?.product?.name || "Service"})`,
          quantity: 1,
          unitPrice: Number(plan?.product?.base_price || 0),
        });
      }

      // 4. Calculate Financials
      const calc = calculateInvoice({
        items: lineItemInputs,
        taxRules,
      });

      const invoiceNumber = generateRunInvoiceNumber();
      const dueDate = new Date(periodStart.getTime());
      dueDate.setDate(dueDate.getDate() + 15);

      // 5. Insert Invoice
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
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select("id")
        .single();

      if (invError) {
        if (invError.code === "23505") {
          duplicatesAvoided++;
        } else {
          failuresCount++;
        }
        continue;
      }

      // 6. Insert Line Items Snapshot
      if (newInvoice && calc.lineItems.length > 0) {
        await supabase.from("invoice_items").insert(
          calc.lineItems.map((li) => ({
            invoice_id: newInvoice.id,
            description: li.description,
            quantity: li.quantity,
            unit_price: li.unitPrice,
            amount: li.subtotal,
            created_at: nowIso,
            updated_at: nowIso,
          }))
        );
      }

      // 7. Advance subscription billing schedule
      // If subscription was marked cancel_at_period_end, close it at end of period
      const shouldClose = Boolean(sub.cancel_at_period_end);

      await supabase
        .from("subscriptions")
        .update({
          status: shouldClose ? "closed" : "active",
          current_period_start: periodStartIso,
          current_period_end: periodEndIso,
          next_billing_date: shouldClose ? null : periodEndIso,
          updated_at: nowIso,
        })
        .eq("id", sub.id);

      invoicesCreated++;
    } catch {
      failuresCount++;
    }
  }

  return {
    invoicesCreated,
    duplicatesAvoided,
    failuresCount,
    details: `Evaluated ${subscriptions.length} active subscriptions. Generated: ${invoicesCreated} invoices. Duplicates prevented: ${duplicatesAvoided}. Failures: ${failuresCount}.`,
  };
}
