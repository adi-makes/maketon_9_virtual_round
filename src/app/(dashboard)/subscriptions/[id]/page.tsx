import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionDetailClient } from "./subscription-detail-client";
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
  }

  const customerData = sub.customer as unknown as {
    id: string;
    name: string;
    email: string;
    company_name?: string | null;
    phone?: string | null;
  } | null;

  const planData = sub.plan as unknown as {
    id: string;
    name: string;
    billing_frequency: "monthly" | "yearly";
    interval_count: number;
    product?: {
      id: string;
      name: string;
      base_price: number;
    };
  } | null;

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

