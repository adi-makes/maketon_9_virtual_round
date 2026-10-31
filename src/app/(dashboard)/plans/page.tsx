import { createClient } from "@/lib/supabase/server";
import { PlanListClient } from "./plan-list-client";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const supabase = await createClient();

  const [{ data: plans }, { data: products }] = await Promise.all([
    supabase
      .from("plans")
      .select(`
        id,
        name,
        billing_frequency,
        interval_count,
        is_active,
        product:products (
          id,
          name,
          base_price
        )
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, name, base_price")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const sanitizedPlans = (plans || []).map((pl) => ({
    id: pl.id,
    name: pl.name,
    billing_frequency: pl.billing_frequency as "monthly" | "yearly",
    interval_count: pl.interval_count,
    is_active: pl.is_active,
    product: (pl.product as unknown as { id: string; name: string; base_price: number }) || {
      id: "",
      name: "Unknown Product",
      base_price: 0,
    },
  }));

  const sanitizedProducts = (products || []).map((p) => ({
    id: p.id,
    name: p.name,
    base_price: Number(p.base_price),
  }));

  return (
    <PlanListClient
      initialPlans={sanitizedPlans}
      products={sanitizedProducts}
    />
  );
}

