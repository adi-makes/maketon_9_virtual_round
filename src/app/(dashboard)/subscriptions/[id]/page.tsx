import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionDetailClient } from "./subscription-detail-client";
import { parsePlan, parseProduct } from "@/lib/plans/config";
import type { SubscriptionStatus } from "@/types";

export const dynamic = "force-dynamic";

interface SubscriptionPageProps {
  params: {
    id: string;
  };
}

export default async function SubscriptionDetailPage({
  params,
}: SubscriptionPageProps) {
  const supabase = await createClient();

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select(`
      id,
      status,
      start_date,
      current_period_start,
      current_period_end,
      next_billing_date,
      cancel_at_period_end,
      customer:customers (
        id,
        name,
        email,
        company_name,
        phone
      ),
      plan:plans (
        *,
        product:products (*)
      ),
      items:subscription_items (
        id,
        quantity,
        unit_price,
        variant:product_variants (
          id,
          name,
          price_adjustment,
          sku
        )
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !sub) {
    notFound();
    return null;
  }

  const customerData = sub.customer as unknown as {
    id: string;
    name: string;
    email: string;
    company_name?: string | null;
    phone?: string | null;
  } | null;

  const rawPlan = (Array.isArray(sub.plan) ? sub.plan[0] : sub.plan) as
    | (Record<string, unknown> & { id: string })
    | null;
  const rawProduct = rawPlan
    ? Array.isArray(rawPlan.product)
      ? (rawPlan.product[0] as Record<string, unknown>)
      : (rawPlan.product as Record<string, unknown> | undefined)
    : undefined;

  const planConfig = rawPlan ? parsePlan(rawPlan as Parameters<typeof parsePlan>[0]) : null;
  const productData = rawProduct ? parseProduct(rawProduct as Parameters<typeof parseProduct>[0]) : null;

  const planData = rawPlan && planConfig
    ? {
        id: (rawPlan as { id: string }).id,
        name: planConfig.cleanName,
        billing_frequency: planConfig.billingFrequency,
        interval_count: planConfig.intervalCount,
        minimum_quantity: planConfig.minimumQuantity,
        availability_start: planConfig.availabilityStart,
        availability_end: planConfig.availabilityEnd,
        auto_close_after_expiry: planConfig.autoCloseAfterExpiry,
        allow_early_closure: planConfig.allowEarlyClosure,
        allow_pausing: planConfig.allowPausing,
        allow_renewal: planConfig.allowRenewal,
        product: productData
          ? {
              id: productData.id,
              name: productData.name,
              base_price: productData.basePrice,
            }
          : undefined,
      }
    : null;

  const itemsData = (sub.items || []) as unknown as Array<{
    id: string;
    quantity: number;
    unit_price: number;
    variant?: {
      id: string;
      name: string;
      price_adjustment: number;
      sku?: string | null;
    } | null;
  }>;

  return (
    <SubscriptionDetailClient
      subscription={{
        id: sub.id,
        status: sub.status as SubscriptionStatus,
        start_date: sub.start_date,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        next_billing_date: sub.next_billing_date,
        cancel_at_period_end: sub.cancel_at_period_end,
        customer: customerData,
        plan: planData,
        items: itemsData,
      }}
    />
  );
}
