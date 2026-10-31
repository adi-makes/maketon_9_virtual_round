import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionForm } from "@/components/forms/subscription-form";

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage() {
  const supabase = await createClient();

  // Fetch active customers, products, variants, and plans cleanly
  const [
    { data: customers },
    { data: products },
    { data: variants },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, email, company_name")
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, description, base_price")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id, product_id, name, price_adjustment, sku"),
    supabase
      .from("plans")
      .select("id, product_id, name, billing_frequency, interval_count")
      .eq("is_active", true),
  ]);

  const sanitizedProducts = (products || []).map((p) => {
    const pVariants = (variants || []).filter((v) => v.product_id === p.id);
    const pPlans = (plans || []).filter((pl) => pl.product_id === p.id);

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      base_price: Number(p.base_price),
      variants: pVariants.map((v) => ({
        id: v.id,
        name: v.name,
        price_adjustment: Number(v.price_adjustment),
        sku: v.sku,
      })),
      plans: pPlans.map((pl) => ({
        id: pl.id,
        name: pl.name,
        billing_frequency: pl.billing_frequency as "monthly" | "yearly",
        interval_count: pl.interval_count,
      })),
    };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/subscriptions" className="hover:underline">
            Subscriptions
          </Link>
          <span>/</span>
          <span>New Subscription</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Create Customer Subscription
        </h1>
        <p className="text-sm text-slate-500">
          Set up recurring billing by linking a customer account with a catalog product and plan.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <SubscriptionForm
          customers={customers || []}
          products={sanitizedProducts}
        />
      </div>
    </div>
  );
}
