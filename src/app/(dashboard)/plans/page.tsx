import { createClient } from "@/lib/supabase/server";
import { PlanListClient } from "./plan-list-client";
import { parsePlan, parseProduct } from "@/lib/plans/config";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const supabase = createClient();

  const [{ data: plans }, { data: products }] = await Promise.all([
    supabase
      .from("plans")
      .select(`
        *,
        product:products (*)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const sanitizedPlans = (plans || []).map((rawPl) => {
    const cfg = parsePlan(rawPl as Parameters<typeof parsePlan>[0]);
    const rawProd = Array.isArray(rawPl.product) ? rawPl.product[0] : rawPl.product;
    const prod = rawProd ? parseProduct(rawProd as Parameters<typeof parseProduct>[0]) : null;

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
      is_active: cfg.isActive,
      product: {
        id: prod?.id || "",
        name: prod?.name || "Unknown Product",
        base_price: prod?.basePrice || 0,
      },
    };
  });

  const sanitizedProducts = (products || []).map((p) => {
    const parsed = parseProduct(p as Parameters<typeof parseProduct>[0]);
    return {
      id: parsed.id,
      name: parsed.name,
      base_price: parsed.basePrice,
    };
  });

  return (
    <PlanListClient plans={sanitizedPlans} products={sanitizedProducts} />
  );
}
