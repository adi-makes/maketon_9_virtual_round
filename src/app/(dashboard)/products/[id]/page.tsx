import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "./product-detail-client";
import { parseProduct, parsePlan } from "@/lib/plans/config";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const supabase = await createClient();

  const [
    { data: rawProduct, error: prodError },
    { data: variants },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .single(),
    supabase
      .from("product_variants")
      .select("id, name, price_adjustment, sku")
      .eq("product_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("plans")
      .select("*")
      .eq("product_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  if (prodError || !rawProduct) {
    notFound();
    return null;
  }

  const product = parseProduct(rawProduct as Parameters<typeof parseProduct>[0]);

  return (
    <ProductDetailClient
      product={{
        id: product.id,
        name: product.name,
        type: product.type,
        description: product.description,
        is_active: product.isActive,
        base_price: product.basePrice,
        cost_price: product.costPrice,
        product_variants: (variants || []).map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price_adjustment: Number(v.price_adjustment),
        })),
        plans: (plans || []).map((pl) => {
          const cfg = parsePlan(pl as Parameters<typeof parsePlan>[0]);
          return {
            id: pl.id,
            name: cfg.cleanName,
            interval_count: cfg.intervalCount,
            is_active: cfg.isActive,
            billing_frequency: cfg.billingFrequency,
            minimum_quantity: cfg.minimumQuantity,
            availability_start: cfg.availabilityStart,
            availability_end: cfg.availabilityEnd,
            auto_close_after_expiry: cfg.autoCloseAfterExpiry,
            allow_early_closure: cfg.allowEarlyClosure,
            allow_pausing: cfg.allowPausing,
            allow_renewal: cfg.allowRenewal,
          };
        }),
      }}
    />
  );
}
