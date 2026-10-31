import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "./product-detail-client";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const supabase = await createClient();

  const [
    { data: product, error: prodError },
    { data: variants },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, base_price, is_active")
      .eq("id", params.id)
      .single(),
    supabase
      .from("product_variants")
      .select("id, name, price_adjustment, sku")
      .eq("product_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("plans")
      .select("id, name, billing_frequency, interval_count, is_active")
      .eq("product_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  if (prodError || !product) {
    notFound();
    return null;
  }

  return (
    <ProductDetailClient
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        is_active: product.is_active,
        base_price: Number(product.base_price),
        product_variants: (variants || []).map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price_adjustment: Number(v.price_adjustment),
        })),
        plans: (plans || []).map((pl) => ({
          id: pl.id,
          name: pl.name,
          interval_count: pl.interval_count,
          is_active: pl.is_active,
          billing_frequency: pl.billing_frequency as "monthly" | "yearly",
        })),
      }}
    />
  );
}
