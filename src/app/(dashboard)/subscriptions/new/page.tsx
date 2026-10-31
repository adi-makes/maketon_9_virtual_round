import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionForm } from "@/components/forms/subscription-form";
import { parsePlan, parseProduct } from "@/lib/plans/config";

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage() {
  const supabase = await createClient();

  // Fetch active customers, products, variants, and plans cleanly
  const [
    { data: customers },
    { data: rawProducts },
    { data: variants },
    { data: rawPlans },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, email, company_name")
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id, product_id, name, price_adjustment, sku"),
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true),
  ]);

  const sanitizedProducts = (rawProducts || []).map((rawP) => {
    const p = parseProduct(rawP as Parameters<typeof parseProduct>[0]);
    const pVariants = (variants || []).filter((v) => v.product_id === p.id);
    const pPlans = (rawPlans || []).filter((pl) => pl.product_id === p.id);

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      base_price: p.basePrice,
      variants: pVariants.map((v) => ({
        id: v.id,
        name: v.name,
        price_adjustment: Number(v.price_adjustment),
        sku: v.sku,
      })),
      plans: pPlans.map((rawPl) => {
        const cfg = parsePlan(rawPl as Parameters<typeof parsePlan>[0]);
        return {
          id: rawPl.id,
          name: cfg.cleanName,
          billing_frequency: cfg.billingFrequency,
          interval_count: cfg.intervalCount,
          minimum_quantity: cfg.minimumQuantity,
          availability_start: cfg.availabilityStart,
          availability_end: cfg.availabilityEnd,
          auto_close_after_expiry: cfg.autoCloseAfterExpiry,
          allow_early_closure: cfg.allowEarlyClosure,
          allow_pausing: cfg.allowPausing,
          allow_renewal: cfg.allowRenewal,
        };
      }),
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
