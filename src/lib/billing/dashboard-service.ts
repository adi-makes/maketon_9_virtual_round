/**
 * SubscriptIQ — Dashboard Financial Metrics Service
 * Maintained by Member 1 & Member 3.
 *
 * Implements authoritative, schema-accurate financial and subscription metrics
 * aggregated from live Supabase tables (subscriptions, invoices, payments, customers).
 */

import { createClient } from "@/lib/supabase/server";
import {
  aggregateDashboardMetrics,
  type DashboardMetrics,
  type MonthlyRevenueStat,
} from "./dashboard-calculations";

export * from "./dashboard-calculations";

/**
 * Retrieves live dashboard metrics directly from Supabase tables.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const [
    { data: payments, error: payError },
    { data: invoices, error: invError },
    { data: subscriptions, error: subError },
    { count: customersCount, error: custError },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select(`
        id,
        payment_number,
        invoice_id,
        customer_id,
        amount,
        status,
        created_at,
        customer:customers (
          id,
          name,
          company_name
        ),
        invoice:invoices (
          id,
          invoice_number
        )
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        subscription_id,
        customer_id,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        paid_amount,
        outstanding_balance,
        due_date,
        status,
        created_at
      `)
      .order("created_at", { ascending: false }),
    (supabase.from("subscriptions") as any)
      .select(`
        id,
        customer_id,
        plan_id,
        status,
        start_date,
        current_period_start,
        current_period_end,
        next_billing_date,
        created_at,
        customer:customers (
          id,
          name,
          email,
          company_name
        ),
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
          variant_id
        )
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true }),
  ]);

  if (payError || invError || subError) {
    const errorMessages = [
      payError ? `payments: ${payError.message}` : null,
      invError ? `invoices: ${invError.message}` : null,
      subError ? `subscriptions: ${subError.message}` : null,
      custError ? `customers: ${custError.message}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    console.warn(`[getDashboardMetrics] Supabase query notice: ${errorMessages}`);
  }

  return aggregateDashboardMetrics({
    subscriptions: subscriptions || [],
    invoices: invoices || [],
    payments: payments || [],
    customersCount: customersCount || 0,
    now: new Date(),
  });
}
