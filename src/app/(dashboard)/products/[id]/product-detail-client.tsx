"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateProduct,
  deleteProduct,
  createVariant,
  deleteVariant,
  createPlan,
  updatePlan,
} from "@/actions/products";
import { formatCurrency } from "@/lib/utils";
import type { ProductType, BillingFrequency } from "@/types";

interface Variant {
  id: string;
  name: string;
  price_adjustment: number;
  sku: string | null;
}

interface Plan {
  id: string;
  name: string;
  billing_frequency: BillingFrequency;
  interval_count: number;
  minimum_quantity: number;
  availability_start: string | null;
  availability_end: string | null;
  auto_close_after_expiry: boolean;
  allow_early_closure: boolean;
  allow_pausing: boolean;
  allow_renewal: boolean;
  is_active: boolean;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    type: ProductType;
    description: string | null;
    base_price: number;
    cost_price: number;
    is_active: boolean;
    product_variants: Variant[];
    plans: Plan[];
  };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();

  // Product Edit State
  const [name, setName] = useState(product.name);
  const [type, setType] = useState<ProductType>(product.type || "service");
  const [description, setDescription] = useState(product.description || "");
  const [basePrice, setBasePrice] = useState(product.base_price);
  const [costPrice, setCostPrice] = useState(product.cost_price || 0);
  const [isActive, setIsActive] = useState(product.is_active);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // New Variant State
  const [varName, setVarName] = useState("");
  const [varPriceAdj, setVarPriceAdj] = useState<number>(0);
  const [varSku, setVarSku] = useState("");
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  // New Plan State
  const [planName, setPlanName] = useState("");
  const [planFreq, setPlanFreq] = useState<BillingFrequency>("monthly");
  const [planInterval, setPlanInterval] = useState<number>(1);
  const [planMinQty, setPlanMinQty] = useState<number>(1);
  const [planStart, setPlanStart] = useState("");
  const [planEnd, setPlanEnd] = useState("");
  const [planAutoClose, setPlanAutoClose] = useState(false);
  const [planAllowEarlyClose, setPlanAllowEarlyClose] = useState(true);
  const [planAllowPausing, setPlanAllowPausing] = useState(true);
  const [planAllowRenewal, setPlanAllowRenewal] = useState(true);
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  // Status/Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: "error", message: "Product name is required." });
      return;
    }
    if (basePrice < 0) {
      setFeedback({ type: "error", message: "Sales price cannot be negative." });
      return;
    }
    if (costPrice < 0) {
      setFeedback({ type: "error", message: "Cost price cannot be negative." });
      return;
    }

    setIsUpdatingProduct(true);
    try {
      const res = await updateProduct(product.id, {
        name,
        type,
        description,
        base_price: Number(basePrice),
        cost_price: Number(costPrice),
        is_active: isActive,
      });
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Update failed." });
      } else {
        setFeedback({ type: "success", message: "Product updated successfully!" });
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error" });
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm(`Are you sure you want to delete or deactivate '${product.name}'?`)) return;
    setIsDeletingProduct(true);
    setFeedback(null);
    try {
      const res = await deleteProduct(product.id);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to remove product." });
      } else {
        setFeedback({ type: "success", message: res.message || "Product operation completed." });
        if (res.data?.action === "deleted") {
          setTimeout(() => router.push("/products"), 1500);
        } else {
          setIsActive(false);
        }
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error" });
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!varName.trim()) {
      setFeedback({ type: "error", message: "Variant name required." });
      return;
    }
    setIsAddingVariant(true);
    try {
      const res = await createVariant({
        product_id: product.id,
        name: varName,
        price_adjustment: Number(varPriceAdj),
        sku: varSku || undefined,
      });
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to add variant." });
      } else {
        setFeedback({ type: "success", message: "Variant added successfully!" });
        setVarName("");
        setVarPriceAdj(0);
        setVarSku("");
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error" });
    } finally {
      setIsAddingVariant(false);
    }
  };

  const handleQuickAddOdoo = () => {
    setVarName("Odoo Variant");
    setVarPriceAdj(560);
    setVarSku("VAR-ODOO-560");
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Are you sure you want to remove this variant?")) return;
    setFeedback(null);
    try {
      const res = await deleteVariant(variantId, product.id);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to delete variant." });
      } else {
        setFeedback({ type: "success", message: "Variant removed." });
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error" });
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!planName.trim()) {
      setFeedback({ type: "error", message: "Plan name required." });
      return;
    }
    setIsAddingPlan(true);
    try {
      const res = await createPlan({
        product_id: product.id,
        name: planName,
        billing_frequency: planFreq,
        interval_count: planInterval,
        minimum_quantity: planMinQty,
        availability_start: planStart || null,
        availability_end: planEnd || null,
        auto_close_after_expiry: planAutoClose,
        allow_early_closure: planAllowEarlyClose,
        allow_pausing: planAllowPausing,
        allow_renewal: planAllowRenewal,
        is_active: true,
      });
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to create plan." });
      } else {
        setFeedback({ type: "success", message: "Plan added successfully!" });
        setPlanName("");
        setPlanInterval(1);
        setPlanMinQty(1);
        setPlanStart("");
        setPlanEnd("");
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error" });
    } finally {
      setIsAddingPlan(false);
    }
  };

  const handleTogglePlan = async (planId: string, currentStatus: boolean) => {
    setFeedback(null);
    try {
      const res = await updatePlan(planId, { is_active: !currentStatus });
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update plan." });
      } else {
        setFeedback({ type: "success", message: "Plan status updated." });
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/products" className="hover:underline">
              Products
            </Link>
            <span>/</span>
            <span>{product.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {product.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteProduct}
            disabled={isDeletingProduct}
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100 disabled:opacity-50"
          >
            {isDeletingProduct ? "Processing..." : "Delete / Deactivate Product"}
          </button>
          <Link
            href="/subscriptions/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Create Subscription
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-md border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Product Details & Edit */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Edit Product Details
            </h2>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Product Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ProductType)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none capitalize"
                >
                  <option value="service">Service</option>
                  <option value="goods">Goods</option>
                  <option value="consumable">Consumable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Sales Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Active Catalog Item
                </label>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProduct}
                className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
              >
                {isUpdatingProduct ? "Saving..." : "Save Product Changes"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Variants and Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Variants Management */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Product Variants & Tier Adjustments
                </h2>
                <p className="text-xs text-slate-500">
                  Variants adjust the sales price for higher user tiers, packages, or addons.
                </p>
              </div>
              <button
                type="button"
                onClick={handleQuickAddOdoo}
                className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 shadow-sm hover:bg-amber-100"
              >
                Preset: Odoo (+₹560)
              </button>
            </div>

            {/* Existing Variants Table */}
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Variant Name</th>
                    <th className="px-4 py-2">SKU</th>
                    <th className="px-4 py-2">Price Adjustment</th>
                    <th className="px-4 py-2">Effective Price</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {product.product_variants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-center text-xs text-slate-500">
                        No variants defined. The product will use sales price {formatCurrency(Number(basePrice))}.
                      </td>
                    </tr>
                  ) : (
                    product.product_variants.map((v) => {
                      const finalPrice = Math.max(0, Number(basePrice) + Number(v.price_adjustment));
                      return (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium text-slate-800">{v.name}</td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-500">
                            {v.sku || "—"}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {Number(v.price_adjustment) >= 0 ? "+" : ""}
                            {formatCurrency(Number(v.price_adjustment))}
                          </td>
                          <td className="px-4 py-2 font-semibold text-blue-600">
                            {formatCurrency(finalPrice)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => handleDeleteVariant(v.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Variant Inline Form */}
            <form onSubmit={handleAddVariant} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700">New Variant Name</label>
                <input
                  type="text"
                  placeholder="e.g. Odoo Variant"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="w-full sm:w-36">
                <label className="block text-xs font-medium text-slate-700">Adjustment (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={varPriceAdj}
                  onChange={(e) => setVarPriceAdj(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-slate-700">SKU (optional)</label>
                <input
                  type="text"
                  placeholder="SKU-1"
                  value={varSku}
                  onChange={(e) => setVarSku(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isAddingVariant}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                + Add
              </button>
            </form>
          </div>

          {/* Plans Configuration */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Recurring Plans & Lifecycle Permissions
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Configure daily, weekly, monthly, and annual cycles, minimum order quantities, and permission controls.
            </p>

            {/* Existing Plans */}
            <div className="space-y-3 mb-6">
              {product.plans.length === 0 ? (
                <div className="rounded border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                  No plans configured for this product yet.
                </div>
              ) : (
                product.plans.map((pl) => (
                  <div
                    key={pl.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded border border-slate-200 p-3 bg-slate-50 text-sm"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{pl.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2">
                        <span className="capitalize font-semibold text-blue-700">
                          {pl.billing_frequency} (every {pl.interval_count})
                        </span>
                        <span>• Min Qty: {pl.minimum_quantity}</span>
                        {pl.availability_end && (
                          <span>• Expires: {new Date(pl.availability_end).toLocaleDateString()}</span>
                        )}
                        <span>• Early Close: {pl.allow_early_closure ? "Yes" : "No"}</span>
                        <span>• Pausing: {pl.allow_pausing ? "Yes" : "No"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleTogglePlan(pl.id, pl.is_active)}
                        className={`text-xs px-2.5 py-1 rounded font-medium ${
                          pl.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {pl.is_active ? "Active" : "Archived"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create Plan Form */}
            <form onSubmit={handleAddPlan} className="space-y-4 border-t border-slate-200 pt-4">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Add New Plan
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Trial Plan"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Billing Cycle</label>
                  <select
                    value={planFreq}
                    onChange={(e) => setPlanFreq(e.target.value as BillingFrequency)}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none capitalize"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Min Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={planMinQty}
                    onChange={(e) => setPlanMinQty(parseInt(e.target.value) || 1)}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Availability Start</label>
                  <input
                    type="date"
                    value={planStart}
                    onChange={(e) => setPlanStart(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Availability End (Expiry)</label>
                  <input
                    type="date"
                    value={planEnd}
                    onChange={(e) => setPlanEnd(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Plan Permissions */}
              <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4 text-xs text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planAllowPausing}
                    onChange={(e) => setPlanAllowPausing(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Allow Pausing
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planAllowEarlyClose}
                    onChange={(e) => setPlanAllowEarlyClose(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Allow Early Close
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planAutoClose}
                    onChange={(e) => setPlanAutoClose(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Auto-close on Expiry
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planAllowRenewal}
                    onChange={(e) => setPlanAllowRenewal(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Allow Renewals
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAddingPlan}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
                >
                  {isAddingPlan ? "Creating..." : "+ Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
