"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubscription } from "@/actions/subscriptions";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionStatus } from "@/types";

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  company_name?: string | null;
}

interface VariantOption {
  id: string;
  name: string;
  price_adjustment: number;
  sku?: string | null;
}

interface PlanOption {
  id: string;
  name: string;
  billing_frequency: "monthly" | "yearly";
  interval_count: number;
}

interface ProductOption {
  id: string;
  name: string;
  description?: string | null;
  base_price: number;
  variants: VariantOption[];
  plans: PlanOption[];
}

interface SubscriptionFormProps {
  customers: CustomerOption[];
  products: ProductOption[];
}

export function SubscriptionForm({ customers, products }: SubscriptionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ""
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ""
  );

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    currentProduct?.plans[0]?.id || ""
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    currentProduct?.variants[0]?.id || ""
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [initialStatus, setInitialStatus] = useState<SubscriptionStatus>("draft");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // When product changes, sync plan & variant
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    setSelectedPlanId(prod?.plans[0]?.id || "");
    setSelectedVariantId(prod?.variants[0]?.id || "");
  };

  const currentPlan = currentProduct?.plans.find((p) => p.id === selectedPlanId);
  const currentVariant = currentProduct?.variants.find((v) => v.id === selectedVariantId);

  // Calculations
  const basePrice = currentProduct ? Number(currentProduct.base_price) : 0;
  const priceAdjustment = currentVariant ? Number(currentVariant.price_adjustment) : 0;
  const unitPrice = Math.max(0, basePrice + priceAdjustment);
  const safeQuantity = Math.max(1, quantity || 1);
  const totalPrice = unitPrice * safeQuantity;

  // Next renewal preview
  const getEstimatedRenewal = () => {
    if (!startDate) return null;
    const date = new Date(startDate);
    const freq = currentPlan?.billing_frequency || "monthly";
    const count = currentPlan?.interval_count || 1;
    if (freq === "yearly") {
      date.setFullYear(date.getFullYear() + count);
    } else {
      date.setMonth(date.getMonth() + count);
    }
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedCustomerId) {
      setErrorMsg("Please select a customer.");
      return;
    }
    if (!selectedPlanId) {
      setErrorMsg("Please select a billing plan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSubscription({
        customerId: selectedCustomerId,
        planId: selectedPlanId,
        startDate: new Date(startDate).toISOString(),
        status: initialStatus,
        items: [
          {
            variantId: selectedVariantId || null,
            quantity: safeQuantity,
            unitPrice: unitPrice,
          },
        ],
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to create subscription.");
      } else {
        setSuccessMsg("Subscription created successfully!");
        if (res.data?.id) {
          router.push(`/subscriptions/${res.data.id}`);
        } else {
          router.push("/subscriptions");
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create subscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Customer Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="">Select a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company_name ? `(${c.company_name})` : ""} — {c.email}
              </option>
            ))}
          </select>
        </div>

        {/* Product Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Base: {formatCurrency(Number(p.base_price))})
              </option>
            ))}
          </select>
        </div>

        {/* Plan Frequency Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Billing Plan <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="">Select a plan</option>
            {currentProduct?.plans.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name} ({pl.billing_frequency === "yearly" ? "Annual" : "Monthly"}, every {pl.interval_count} {pl.billing_frequency === "yearly" ? "yr" : "mo"})
              </option>
            ))}
          </select>
          {(!currentProduct?.plans || currentProduct.plans.length === 0) && (
            <p className="text-xs text-amber-600">
              No plans configured for this product. Please create a plan first under Plans.
            </p>
          )}
        </div>

        {/* Variant / Tier Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Product Variant / Tier
          </label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">No Variant (Base Product only)</option>
            {currentProduct?.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({Number(v.price_adjustment) >= 0 ? "+" : ""}{formatCurrency(Number(v.price_adjustment))})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Quantity (Seats / Units) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Subscription Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Initial Lifecycle Status */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Initial Status
          </label>
          <select
            value={initialStatus}
            onChange={(e) => setInitialStatus(e.target.value as SubscriptionStatus)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="draft">Draft (Under review)</option>
            <option value="quotation">Quotation (Issued to customer)</option>
            <option value="confirmed">Confirmed (Accepted, awaiting activation)</option>
            <option value="active">Active (Immediate billing schedule)</option>
          </select>
          <p className="text-xs text-slate-500">
            Standard workflow progresses from Draft &rarr; Quotation &rarr; Confirmed &rarr; Active.
          </p>
        </div>
      </div>

      {/* Pricing Calculation Summary Box */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
          Live Pricing Calculation
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <span className="text-xs text-slate-500">Base Price:</span>
            <div className="font-semibold text-slate-900">{formatCurrency(basePrice)}</div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Variant Adjustment:</span>
            <div className="font-semibold text-slate-900">
              {priceAdjustment >= 0 ? "+" : ""}
              {formatCurrency(priceAdjustment)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Unit Price:</span>
            <div className="font-semibold text-blue-600">{formatCurrency(unitPrice)}</div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Quantity:</span>
            <div className="font-semibold text-slate-900">{safeQuantity}</div>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs text-slate-500">Billing Interval:</span>
            <div className="font-medium text-slate-800">
              {currentPlan?.billing_frequency === "yearly" ? "Annual" : "Monthly"} (Interval: {currentPlan?.interval_count || 1})
            </div>
            {getEstimatedRenewal() && (
              <span className="text-xs text-slate-500">
                First renewal estimate: <strong>{getEstimatedRenewal()}</strong>
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Total Amount</span>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalPrice)}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Subscription"}
        </button>
      </div>
    </form>
  );
}
