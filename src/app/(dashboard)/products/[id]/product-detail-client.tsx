"use client";

import { useState } from "react";
import Link from "next/link";
import {
  updateProduct,
  createVariant,
  deleteVariant,
  createPlan,
  updatePlan,
} from "@/actions/products";
import { formatCurrency } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  price_adjustment: number;
  sku: string | null;
}

interface Plan {
  id: string;
  name: string;
  billing_frequency: "monthly" | "yearly";
  interval_count: number;
  is_active: boolean;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    base_price: number;
    is_active: boolean;
    product_variants: Variant[];
    plans: Plan[];
  };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  // Product Edit State
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || "");
  const [basePrice, setBasePrice] = useState(product.base_price);
  const [isActive, setIsActive] = useState(product.is_active);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  // New Variant State
  const [varName, setVarName] = useState("");
  const [varPriceAdj, setVarPriceAdj] = useState<number>(0);
  const [varSku, setVarSku] = useState("");
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  // New Plan State
  const [planName, setPlanName] = useState("");
  const [planFreq, setPlanFreq] = useState<"monthly" | "yearly">("monthly");
  const [planInterval, setPlanInterval] = useState<number>(1);
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  // Status/Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsUpdatingProduct(true);
    try {
      const res = await updateProduct(product.id, {
        name,
        description,
        base_price: Number(basePrice),
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
        is_active: true,
      });
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to create plan." });
      } else {
        setFeedback({ type: "success", message: "Plan added successfully!" });
        setPlanName("");
        setPlanInterval(1);
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
          <Link
            href="/subscriptions/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Create Subscription with this Product
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
                <label className="block text-xs font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
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

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Base Price (₹)
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
                  Variants adjust the base price for higher user tiers or add-on packages.
                </p>
              </div>
            </div>

            {/* Existing Variants Table */}
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Variant Name</th>
                    <th className="px-4 py-2">SKU</th>
                    <th className="px-4 py-2">Price Adjustment</th>
                    <th className="px-4 py-2">Total Unit Price</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {product.product_variants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-center text-xs text-slate-500">
                        No variants defined. The product will use base price {formatCurrency(Number(basePrice))}.
                      </td>
                    </tr>
                  ) : (
                    product.product_variants.map((v) => {
                      const finalPrice = Math.max(0, Number(basePrice) + Number(v.price_adjustment));
                      return (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{v.name}</td>
                          <td className="px-4 py-3 text-slate-500">{v.sku || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {Number(v.price_adjustment) >= 0 ? "+" : ""}
                            {formatCurrency(Number(v.price_adjustment))}
                          </td>
                          <td className="px-4 py-3 font-semibold text-blue-600">
                            {formatCurrency(finalPrice)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
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

            {/* Add Variant Form */}
            <form onSubmit={handleAddVariant} className="mt-4 rounded-md bg-slate-50 p-4 border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-3">
                Add New Variant
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Variant name (e.g. Enterprise Tier)"
                    value={varName}
                    onChange={(e) => setVarName(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price Adj (₹)"
                    value={varPriceAdj}
                    onChange={(e) => setVarPriceAdj(parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="SKU"
                    value={varSku}
                    onChange={(e) => setVarSku(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingVariant}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingVariant ? "Adding..." : "+ Add Variant"}
                </button>
              </div>
            </form>
          </div>

          {/* Billing Plans Management */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Subscription Plans
                </h2>
                <p className="text-xs text-slate-500">
                  Define monthly and annual recurrence intervals for this product.
                </p>
              </div>
            </div>

            {/* Existing Plans Table */}
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Plan Name</th>
                    <th className="px-4 py-2">Frequency</th>
                    <th className="px-4 py-2">Interval</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {product.plans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-center text-xs text-slate-500">
                        No billing plans configured. Customers cannot subscribe without a plan.
                      </td>
                    </tr>
                  ) : (
                    product.plans.map((pl) => (
                      <tr key={pl.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{pl.name}</td>
                        <td className="px-4 py-3 text-slate-700 capitalize">
                          {pl.billing_frequency}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          Every {pl.interval_count} {pl.billing_frequency === "yearly" ? "year" : "month"}
                          {pl.interval_count > 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              pl.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {pl.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleTogglePlan(pl.id, pl.is_active)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {pl.is_active ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Plan Form */}
            <form onSubmit={handleAddPlan} className="mt-4 rounded-md bg-slate-50 p-4 border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-3">
                Create Billing Plan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Plan Name (e.g. Annual Plan)"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <select
                    value={planFreq}
                    onChange={(e) => setPlanFreq(e.target.value as "monthly" | "yearly")}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Interval count (e.g. 1)"
                    value={planInterval}
                    onChange={(e) => setPlanInterval(parseInt(e.target.value) || 1)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingPlan}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingPlan ? "Creating..." : "+ Add Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

