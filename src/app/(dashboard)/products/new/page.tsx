"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProduct } from "@/actions/products";
import { formatCurrency } from "@/lib/utils";
import type { ProductType } from "@/types";

interface VariantRow {
  name: string;
  price_adjustment: number;
  sku: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<ProductType>("service");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(1000);
  const [costPrice, setCostPrice] = useState<number>(200);
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<VariantRow[]>([
    { name: "Standard", price_adjustment: 0, sku: "VAR-STD" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddVariant = () => {
    setVariants([...variants, { name: "", price_adjustment: 0, sku: "" }]);
  };

  const handleAddOdooVariant = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setVariants([
      ...variants,
      { name: "Odoo Variant", price_adjustment: 560, sku: `VAR-ODOO-${randomSuffix}` },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantRow,
    value: string | number
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Validation error: Product name is required.");
      return;
    }
    if (basePrice === undefined || basePrice === null || Number(basePrice) < 0) {
      setErrorMsg("Validation error: Sales price must be greater than or equal to 0.");
      return;
    }
    if (costPrice === undefined || costPrice === null || Number(costPrice) < 0) {
      setErrorMsg("Validation error: Cost price must be greater than or equal to 0.");
      return;
    }

    // Filter valid variants
    const validVariants = variants
      .filter((v) => v.name.trim() !== "")
      .map((v) => ({
        name: v.name.trim(),
        price_adjustment: Number(v.price_adjustment) || 0,
        sku: v.sku.trim() || undefined,
      }));

    setIsSubmitting(true);
    try {
      const res = await createProduct({
        name,
        type,
        description,
        base_price: Number(basePrice),
        cost_price: Number(costPrice),
        is_active: isActive,
        variants: validVariants.length > 0 ? validVariants : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to create product.");
      } else {
        router.push(res.data?.id ? `/products/${res.data.id}` : "/products");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error creating product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/products" className="hover:underline">
              Products
            </Link>
            <span>/</span>
            <span>New Product</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Create New Product
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {/* Core Product Information */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Product Details</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Cloud ERP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
              >
                <option value="service">Service</option>
                <option value="goods">Goods</option>
                <option value="consumable">Consumable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Detailed product features and deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Sales Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Standard baseline sales price.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Cost Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Internal delivery / operational cost.
              </p>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Active in Catalog
              </label>
            </div>
          </div>
        </div>

        {/* Product Variants (Tiers & Addons) */}
        <div className="space-y-4 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Pricing Variants & Tiers
              </h2>
              <p className="text-xs text-slate-500">
                Configure variants like Standard, Professional, or Odoo Variant with price adjustments.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddOdooVariant}
                className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 shadow-sm hover:bg-amber-100"
              >
                + Add Odoo Variant (+₹560)
              </button>
              <button
                type="button"
                onClick={handleAddVariant}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                + Add Variant
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => {
              const effectivePrice = Math.max(0, Number(basePrice) + Number(v.price_adjustment));
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Variant Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Odoo Variant"
                      value={v.name}
                      onChange={(e) => handleVariantChange(idx, "name", e.target.value)}
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="block text-xs font-medium text-slate-600">
                      Price Adjustment (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={v.price_adjustment}
                      onChange={(e) =>
                        handleVariantChange(idx, "price_adjustment", parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-medium text-slate-600">
                      SKU (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="SKU-ODOO-1"
                      value={v.sku}
                      onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="w-full sm:w-32 pt-1 text-xs text-slate-700">
                    <span className="text-slate-500">Effective:</span>
                    <div className="font-semibold text-blue-600">
                      {formatCurrency(effectivePrice)}
                    </div>
                  </div>

                  {variants.length > 1 && (
                    <div className="pt-4 sm:pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/products"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
