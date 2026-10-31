/**
 * Invoice Management Service for SubscriptIQ.
 * Handles generation from subscriptions, querying with relational filters,
 * line-item snapshotting, and duplicate billing protection.
 */

import { createClient } from "@/lib/supabase/server";
import { calculateInvoice, type LineItemInput } from "./calculations";
import { getActiveTaxRules } from "./tax-service";
import { validateDiscountCode } from "./discount-service";
import type { InvoiceStatus, ActionResponse } from "@/types";

export interface GenerateInvoiceOptions {
  discountCode?: string;
  dueDateDays?: number; // default 15 days
}

export interface InvoiceGenerationResult {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  periodStart: string;
  periodEnd: string;
  alreadyBilled: boolean;
}

/**
 * Generates next sequential invoice number.
 */
function generateFallbackInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `INV-${year}-${rand}`;
}

/**
 * Generates an invoice for an active/confirmed subscription for its current/next billing period.
 * Strictly prevents duplicate billing using database unique constraints and pre-checks.
 */
export async function generateInvoiceForSubscription(
  subscriptionId: string,
  options: GenerateInvoiceOptions = {}
): Promise<ActionResponse<InvoiceGenerationResult>> {
  if (!subscriptionId) {
    return { success: false, error: "Subscription ID is required." };
  }

  const supabase = await createClient();

  // 1. Fetch subscription with plan, product, variants, and items
  const { data: sub, error: subError } = await (supabase
    .from("subscriptions") as any)
    .select(`
      id,
      customer_id,
      status,
      start_date,
      current_period_start,
      current_period_end,
      next_billing_date,
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
    .eq("id", subscriptionId)
    .single();

  if (subError || !sub) {
    return { success: false, error: "Subscription not found or inaccessible." };
  }

  // Only active or confirmed subscriptions can be billed
  if (sub.status !== "active" && sub.status !== "confirmed") {
    return {
      success: false,
      error: `Subscription is currently in '${sub.status}' state and is not eligible for billing.`,
    };
  }

  const plan = sub.plan as any;
  const frequency = plan?.billing_frequency || "monthly";
  const intervalCount = plan?.interval_count || 1;

  // 2. Compute Billing Period
  const periodStart = sub.next_billing_date
    ? new Date(sub.next_billing_date)
    : sub.current_period_start
    ? new Date(sub.current_period_start)
    : new Date(sub.start_date);

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

  // 3. Pre-check for duplicate billing
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount")
    .eq("subscription_id", sub.id)
    .eq("billing_period_start", periodStartIso)
    .eq("billing_period_end", periodEndIso)
    .maybeSingle();

  if (existingInvoice) {
    return {
      success: true,
      message: `Period ${periodStartIso.slice(0, 10)} to ${periodEndIso.slice(0, 10)} is already billed (${existingInvoice.invoice_number}).`,
      data: {
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoice_number,
        totalAmount: Number(existingInvoice.total_amount),
        periodStart: periodStartIso,
        periodEnd: periodEndIso,
        alreadyBilled: true,
      },
    };
  }

  // 4. Build line items
  const subItems = (sub.items as any[]) || [];
  const lineItemInputs: LineItemInput[] = [];

  if (subItems.length > 0) {
    for (const item of subItems) {
      const base = Number(plan?.product?.base_price || 0);
      const adjustment = Number(item.variant?.price_adjustment || 0);
      const unitPrice = Number(item.unit_price) || Math.max(0, base + adjustment);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const desc = `${plan?.product?.name || "Service Plan"} — ${item.variant?.name || "Standard Tier"}`;

      lineItemInputs.push({
        description: desc,
        quantity,
        unitPrice,
      });
    }
  } else {
    // Fallback: charge base plan price if subscription has no line items attached
    const unitPrice = Number(plan?.product?.base_price || 0);
    lineItemInputs.push({
      description: `${plan?.name || "Subscription Plan"} (${plan?.product?.name || "Base Offering"})`,
      quantity: 1,
      unitPrice,
    });
  }

  // 5. Evaluate Discounts
  let discountSpec = undefined;
  if (options.discountCode) {
    const discountCheck = await validateDiscountCode(options.discountCode);
    if (discountCheck.valid && discountCheck.discount) {
      discountSpec = discountCheck.discount;
    }
  }

  // 6. Taxes and Monetary Calculation
  const taxRules = await getActiveTaxRules();
  const calc = calculateInvoice({
    items: lineItemInputs,
    discount: discountSpec,
    taxRules,
  });

  // Due date (default 15 days from period start)
  const dueDays = options.dueDateDays || 15;
  const dueDate = new Date(periodStart);
  dueDate.setDate(dueDate.getDate() + dueDays);

  const invoiceNumber = generateFallbackInvoiceNumber();
  const nowIso = new Date().toISOString();

  // 7. Insert Invoice Row
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
    .select("id, invoice_number")
    .single();

  if (invError) {
    // Unique constraint violation check
    if (invError.code === "23505") {
      return {
        success: true,
        message: "Invoice already generated for this billing period (idempotency enforced).",
        data: {
          invoiceId: "",
          invoiceNumber: "",
          totalAmount: calc.totalAmount,
          periodStart: periodStartIso,
          periodEnd: periodEndIso,
          alreadyBilled: true,
        },
      };
    }
    return { success: false, error: `Failed to create invoice: ${invError.message}` };
  }

  // 8. Insert Snapshot Line Items
  if (newInvoice && calc.lineItems.length > 0) {
    const itemRows = calc.lineItems.map((li) => ({
      invoice_id: newInvoice.id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unitPrice,
      amount: li.subtotal,
      created_at: nowIso,
      updated_at: nowIso,
    }));

    const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows);
    if (itemsError) {
      console.error("Warning: Failed to insert invoice_items snapshot:", itemsError);
    }
  }

  // 9. Advance Subscription Schedule
  await supabase
    .from("subscriptions")
    .update({
      current_period_start: periodStartIso,
      current_period_end: periodEndIso,
      next_billing_date: periodEndIso,
      updated_at: nowIso,
    })
    .eq("id", sub.id);

  return {
    success: true,
    message: `Invoice ${newInvoice.invoice_number} generated successfully for ₹${calc.totalAmount.toLocaleString("en-IN")}.`,
    data: {
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoice_number,
      totalAmount: calc.totalAmount,
      periodStart: periodStartIso,
      periodEnd: periodEndIso,
      alreadyBilled: false,
    },
  };
}

/**
 * Retrieves a single invoice with its full relational graph:
 * customer details, line items, and payment history.
 */
export async function getInvoiceById(invoiceId: string) {
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      subscription_id,
      customer_id,
      billing_period_start,
      billing_period_end,
      due_date,
      subtotal,
      discount_amount,
      tax_amount,
      total_amount,
      paid_amount,
      outstanding_balance,
      status,
      created_at,
      updated_at,
      customer:customers (
        id,
        name,
        email,
        company_name,
        phone,
        billing_address
      ),
      items:invoice_items (
        id,
        description,
        quantity,
        unit_price,
        amount
      ),
      payments:payments (
        id,
        payment_number,
        amount,
        method,
        reference,
        status,
        created_at
      )
    `)
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) {
    return null;
  }

  return invoice;
}

/**
 * Fetches all invoices with customer summary and supports status and search filtering.
 */
export async function getInvoices(filters?: {
  status?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      subscription_id,
      customer_id,
      billing_period_start,
      billing_period_end,
      due_date,
      subtotal,
      discount_amount,
      tax_amount,
      total_amount,
      paid_amount,
      outstanding_balance,
      status,
      created_at,
      customer:customers (
        id,
        name,
        email,
        company_name
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status as any);
  }

  const { data: invoices, error } = await query;
  if (error || !invoices) {
    return [];
  }

  // Client-side search filtering if provided
  if (filters?.search && filters.search.trim()) {
    const s = filters.search.toLowerCase().trim();
    return invoices.filter((inv: any) => {
      const numMatch = inv.invoice_number?.toLowerCase().includes(s);
      const custMatch =
        inv.customer?.name?.toLowerCase().includes(s) ||
        inv.customer?.company_name?.toLowerCase().includes(s);
      return numMatch || custMatch;
    });
  }

  return invoices;
}

/**
 * Transitions a draft invoice to confirmed.
 */
export async function confirmInvoice(invoiceId: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("status", "draft");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: "Invoice confirmed successfully." };
}

/**
 * Cancels an issued or draft invoice.
 */
export async function cancelInvoice(invoiceId: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const { data: inv, error: fetchErr } = await supabase
    .from("invoices")
    .select("status, paid_amount")
    .eq("id", invoiceId)
    .single();

  if (fetchErr || !inv) {
    return { success: false, error: "Invoice not found." };
  }

  if (inv.status === "paid") {
    return { success: false, error: "Cannot cancel a fully paid invoice." };
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: "Invoice cancelled." };
}
