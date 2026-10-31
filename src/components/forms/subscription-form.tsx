"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubscription } from "@/actions/subscriptions";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionStatus, BillingFrequency } from "@/types";

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
  billing_frequency: BillingFrequency;
  interval_count: number;
  minimum_quantity: number;
  availability_start?: string | null;
  availability_end?: string | null;
  auto_close_after_expiry?: boolean;
  allow_early_closure?: boolean;
  allow_pausing?: boolean;
  allow_renewal?: boolean;
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

  const currentPlan = currentProduct?.plans.find((p) => p.id === selectedPlanId);
  const currentVariant = currentProduct?.variants.find((v) => v.id === selectedVariantId);

  const minRequiredQty = currentPlan?.minimum_quantity || 1;
  const [quantity, setQuantity] = useState<number>(minRequiredQty);
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
    const firstPlan = prod?.plans[0];
    setSelectedPlanId(firstPlan?.id || "");
    setSelectedVariantId(prod?.variants[0]?.id || "");
    if (firstPlan?.minimum_quantity && quantity < firstPlan.minimum_quantity) {
      setQuantity(firstPlan.minimum_quantity);
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const targetPlan = currentProduct?.plans.find((p) => p.id === planId);
    if (targetPlan?.minimum_quantity && quantity < targetPlan.minimum_quantity) {
      setQuantity(targetPlan.minimum_quantity);
    }
  };

  // Calculations
  const basePrice = currentProduct ? Number(currentProduct.base_price) : 0;
  const priceAdjustment = currentVariant ? Number(currentVariant.price_adjustment) : 0;
  const unitPrice = Math.max(0, basePrice + priceAdjustment);
  const safeQuantity = Math.max(1, quantity || 1);
  const totalPrice = unitPrice * safeQuantity;

  // Next renewal preview supporting daily, weekly, monthly, yearly
  const getEstimatedRenewal = () => {
    if (!startDate) return null;
    const date = new Date(startDate);
    const freq = currentPlan?.billing_frequency || "monthly";
    const count = Math.max(1, currentPlan?.interval_count || 1);

    if (freq === "daily") {
      date.setDate(date.getDate() + count);
    } else if (freq === "weekly") {
      date.setDate(date.getDate() + count * 7);
    } else if (freq === "yearly") {
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

  // Check if plan has expired
  const isPlanExpired = () => {
    if (!currentPlan?.availability_end) return false;
    return new Date().getTime() > new Date(currentPlan.availability_end).getTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedCustomerId) {
      setErrorMsg("Validation error: Please select a customer.");
      return;
    }
    if (!selectedPlanId) {
      setErrorMsg("Validation error: Please select a billing plan.");
      return;
    }

    if (currentPlan && quantity < currentPlan.minimum_quantity) {
      setErrorMsg(
        `Validation error: Minimum quantity required for this plan is ${currentPlan.minimum_quantity}.`
      );
      return;
    }

    if (isPlanExpired()) {
      setErrorMsg("Action rejected: This plan has expired and is no longer available.");
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
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Customer Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Customer Organization <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          required
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name ? `${c.company_name} (${c.name})` : c.name} — {c.email}
            </option>
          ))}
        </select>
      </div>

      {/* Product & Variant Selection */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Catalog Product <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            required
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Base: {formatCurrency(p.base_price)})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Product Variant / Tier
          </label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          >
            {currentProduct?.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({Number(v.price_adjustment) >= 0 ? "+" : ""}
                {formatCurrency(Number(v.price_adjustment))})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Billing Plan & Cycle */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Billing Plan & Cycle <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => handlePlanChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            required
          >
            {currentProduct?.plans.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name} — Every {pl.interval_count} {pl.billing_frequency}
                {pl.minimum_quantity > 1 ? ` (Min Qty: ${pl.minimum_quantity})` : ""}
              </option>
            ))}
          </select>

          {currentPlan && (
            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
              {currentPlan.minimum_quantity > 1 && (
                <div className="text-amber-700 font-medium">
                  ⚠️ This plan requires a minimum order of {currentPlan.minimum_quantity} units.
                </div>
              )}
              {currentPlan.availability_end && (
                <div>
                  Plan availability ends:{" "}
                  <strong>{new Date(currentPlan.availability_end).toLocaleDateString()}</strong>
                </div>
              )}
              <div>
                Configured permissions: Pausing:{" "}
                <strong>{currentPlan.allow_pausing ? "Allowed" : "Prohibited"}</strong>, Early Close:{" "}
                <strong>{currentPlan.allow_early_closure ? "Allowed" : "Prohibited"}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Quantity / User Seats <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={minRequiredQty}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || minRequiredQty)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            required
          />
          <p className="text-xs text-slate-500">
            Minimum required for this plan: {minRequiredQty}.
          </p>
        </div>
      </div>

      {/* Start Date & Initial Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Subscription Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Initial Status
          </label>
          <select
            value={initialStatus}
            onChange={(e) => setInitialStatus(e.target.value as SubscriptionStatus)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="draft">Draft (Preliminary quote)</option>
            <option value="quotation">Quotation (Presented to client)</option>
            <option value="confirmed">Confirmed (Order approved)</option>
            <option value="active">Active (Immediate billing)</option>
          </select>
        </div>
      </div>

      {/* Live Financial Breakdown Summary */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Order Summary & Recurring Forecast
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-500">Base Unit Price:</span>
            <div className="font-semibold text-slate-800">{formatCurrency(basePrice)}</div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Variant Adjustment:</span>
            <div className="font-semibold text-slate-800">
              {priceAdjustment >= 0 ? "+" : ""}
              {formatCurrency(priceAdjustment)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Effective Unit Price:</span>
            <div className="font-bold text-blue-600">{formatCurrency(unitPrice)}</div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Total Recurring Fee:</span>
            <div className="font-extrabold text-slate-900 text-base">
              {formatCurrency(totalPrice)}
            </div>
          </div>
        </div>

        {getEstimatedRenewal() && (
          <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>First Period End / Renewal Date:</span>
            <span className="font-semibold text-slate-800">{getEstimatedRenewal()}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || products.length === 0}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating Subscription..." : "Create Subscription"}
        </button>
      </div>
    </form>
  );
}
