import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();

  const [
    { data: products, error },
    { data: allVariants },
    { data: allPlans },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, base_price, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("product_variants")
      .select("id, product_id, name, price_adjustment"),
    supabase
      .from("plans")
      .select("id, product_id, name, billing_frequency"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products & Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Manage your subscription products, tiered variants, and pricing rules.
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
        >
          + Add New Product
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load products: {error.message}
        </div>
      )}

      {products && products.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 p-12 text-center">
          <h3 className="text-base font-semibold text-slate-800">No products configured</h3>
          <p className="mt-1 text-sm text-slate-500">
            Get started by adding your first product with base pricing.
          </p>
          <div className="mt-6">
            <Link
              href="/products/new"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
            >
              Create Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Base Price</th>
                <th className="px-6 py-3">Variants</th>
                <th className="px-6 py-3">Plans</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {products?.map((p) => {
                const variants = (allVariants || []).filter((v) => v.product_id === p.id);
                const plans = (allPlans || []).filter((pl) => pl.product_id === p.id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/products/${p.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {p.name}
                      </Link>
                      {p.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatCurrency(Number(p.base_price))}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {variants.length} variant{variants.length === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {plans.length} plan{plans.length === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.is_active ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/products/${p.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
