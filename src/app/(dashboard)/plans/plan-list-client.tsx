"use client";

import { useState } from "react";
import Link from "next/link";
import { createPlan, updatePlan, togglePlanStatus } from "@/actions/products";
import { formatCurrency } from "@/lib/utils";
import type { BillingFrequency } from "@/types";

export interface PlanItem {
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
  product: {
    id: string;
    name: string;
    base_price: number;
  };
}

interface ProductOption {
  id: string;
  name: string;
  base_price: number;
}

interface PlanListClientProps {
  initialPlans: PlanItem[];
  products: ProductOption[];
}

export function PlanListClient({ initialPlans, products }: PlanListClientProps) {
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans);
  const [filterFrequency, setFilterFrequency] = useState<string>("all");
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ""
  );

  // New Plan State
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<BillingFrequency>("monthly");
  const [intervalCount, setIntervalCount] = useState<number>(1);
  const [minimumQuantity, setMinimumQuantity] = useState<number>(1);
  const [availabilityStart, setAvailabilityStart] = useState("");
  const [availabilityEnd, setAvailabilityEnd] = useState("");
  const [autoCloseAfterExpiry, setAutoCloseAfterExpiry] = useState(false);
  const [allowEarlyClosure, setAllowEarlyClosure] = useState(true);
  const [allowPausing, setAllowPausing] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);

  // Edit Plan Modal State
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editFrequency, setEditFrequency] = useState<BillingFrequency>("monthly");
  const [editIntervalCount, setEditIntervalCount] = useState(1);
  const [editMinQty, setEditMinQty] = useState(1);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editAutoClose, setEditAutoClose] = useState(false);
  const [editAllowEarlyClose, setEditAllowEarlyClose] = useState(true);
  const [editAllowPausing, setEditAllowPausing] = useState(true);
  const [editAllowRenewal, setEditAllowRenewal] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredPlans = plans.filter((pl) => {
    if (filterFrequency === "all") return true;
    return pl.billing_frequency === filterFrequency;
  });

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedProductId) {
      setMessage({ type: "error", text: "Please select a product." });
      return;
    }
    if (!name.trim()) {
      setMessage({ type: "error", text: "Validation error: Plan name is required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPlan({
        product_id: selectedProductId,
        name: name.trim(),
        billing_frequency: frequency,
        interval_count: Number(intervalCount) || 1,
        minimum_quantity: Number(minimumQuantity) || 1,
        availability_start: availabilityStart || null,
        availability_end: availabilityEnd || null,
        auto_close_after_expiry: autoCloseAfterExpiry,
        allow_early_closure: allowEarlyClosure,
        allow_pausing: allowPausing,
        allow_renewal: allowRenewal,
        is_active: true,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Failed to create plan." });
      } else {
        setMessage({ type: "success", text: "Billing plan created successfully!" });
        setName("");
        setIntervalCount(1);
        setMinimumQuantity(1);
        setAvailabilityStart("");
        setAvailabilityEnd("");

        // Refresh local state
        const targetProd = products.find((p) => p.id === selectedProductId);
        if (res.data?.id && targetProd) {
          setPlans([
            {
              id: res.data.id,
              name: name.trim(),
              billing_frequency: frequency,
              interval_count: Number(intervalCount) || 1,
              minimum_quantity: Number(minimumQuantity) || 1,
              availability_start: availabilityStart || null,
              availability_end: availabilityEnd || null,
              auto_close_after_expiry: autoCloseAfterExpiry,
              allow_early_closure: allowEarlyClosure,
              allow_pausing: allowPausing,
              allow_renewal: allowRenewal,
              is_active: true,
              product: targetProd,
            },
            ...plans,
          ]);
        }
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (pl: PlanItem) => {
    setEditingPlan(pl);
    setEditName(pl.name);
    setEditFrequency(pl.billing_frequency);
    setEditIntervalCount(pl.interval_count);
    setEditMinQty(pl.minimum_quantity);
    setEditStart(pl.availability_start ? pl.availability_start.split("T")[0] : "");
    setEditEnd(pl.availability_end ? pl.availability_end.split("T")[0] : "");
    setEditAutoClose(pl.auto_close_after_expiry);
    setEditAllowEarlyClose(pl.allow_early_closure);
    setEditAllowPausing(pl.allow_pausing);
    setEditAllowRenewal(pl.allow_renewal);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setMessage(null);
    setIsSubmitting(true);

    try {
      const res = await updatePlan(editingPlan.id, {
        name: editName.trim(),
        billing_frequency: editFrequency,
        interval_count: editIntervalCount,
        minimum_quantity: editMinQty,
        availability_start: editStart || null,
        availability_end: editEnd || null,
        auto_close_after_expiry: editAutoClose,
        allow_early_closure: editAllowEarlyClose,
        allow_pausing: editAllowPausing,
        allow_renewal: editAllowRenewal,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Failed to update plan." });
      } else {
        setMessage({ type: "success", text: "Plan updated successfully!" });
        setPlans(
          plans.map((p) =>
            p.id === editingPlan.id
              ? {
                  ...p,
                  name: editName.trim(),
                  billing_frequency: editFrequency,
                  interval_count: editIntervalCount,
                  minimum_quantity: editMinQty,
                  availability_start: editStart || null,
                  availability_end: editEnd || null,
                  auto_close_after_expiry: editAutoClose,
                  allow_early_closure: editAllowEarlyClose,
                  allow_pausing: editAllowPausing,
                  allow_renewal: editAllowRenewal,
                }
              : p
          )
        );
        setEditingPlan(null);
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (planId: string, currentStatus: boolean) => {
    setMessage(null);
    try {
      const res = await togglePlanStatus(planId, !currentStatus);
      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Failed to update plan status." });
      } else {
        setPlans(
          plans.map((p) => (p.id === planId ? { ...p, is_active: !currentStatus } : p))
        );
        setMessage({ type: "success", text: "Plan status updated." });
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Subscription Plans
          </h1>
          <p className="text-sm text-slate-500">
            Configure daily, weekly, monthly, and annual billing cycles, minimum quantity limits, and lifecycle permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/subscriptions/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            + New Subscription
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-md border p-4 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Quick Add Plan Box */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-2">
          Create New Billing Plan
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Associate a daily, weekly, monthly, or yearly frequency with any existing product in the catalog.
        </p>
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.base_price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Plan Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Daily Trial Plan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Billing Cycle & Interval
              </label>
              <div className="flex gap-2">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as BillingFrequency)}
                  className="w-2/3 rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none capitalize"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <input
                  type="number"
                  min="1"
                  title="Interval count"
                  placeholder="1"
                  value={intervalCount}
                  onChange={(e) => setIntervalCount(parseInt(e.target.value) || 1)}
                  className="w-1/3 rounded border border-slate-300 bg-white px-2 py-2 text-sm text-center focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minimum Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(parseInt(e.target.value) || 1)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Availability Start Date (Optional)
              </label>
              <input
                type="date"
                value={availabilityStart}
                onChange={(e) => setAvailabilityStart(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Availability End Date (Expiry)
              </label>
              <input
                type="date"
                value={availabilityEnd}
                onChange={(e) => setAvailabilityEnd(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Permission Flags */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPausing}
                onChange={(e) => setAllowPausing(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Allow Pausing
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowEarlyClosure}
                onChange={(e) => setAllowEarlyClosure(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Allow Early Closure
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCloseAfterExpiry}
                onChange={(e) => setAutoCloseAfterExpiry(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-Close After Expiry
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowRenewal}
                onChange={(e) => setAllowRenewal(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Allow Renewals
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || products.length === 0}
              className="rounded-md bg-slate-900 px-6 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "+ Create Plan"}
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Filter Frequency:</span>
            {["all", "daily", "weekly", "monthly", "yearly"].map((freq) => (
              <button
                key={freq}
                onClick={() => setFilterFrequency(freq)}
                className={`rounded px-2.5 py-1 text-xs font-medium capitalize ${
                  filterFrequency === freq
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Plan Name</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Cycle</th>
                <th className="px-6 py-3">Min Qty</th>
                <th className="px-6 py-3">Availability</th>
                <th className="px-6 py-3">Permissions</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                    No plans matching the filter.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((pl) => (
                  <tr key={pl.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {pl.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <Link
                        href={`/products/${pl.product.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {pl.product.name}
                      </Link>
                      <div className="text-xs text-slate-400">
                        {formatCurrency(pl.product.base_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
                        Every {pl.interval_count} {pl.billing_frequency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">
                      {pl.minimum_quantity}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {pl.availability_end ? (
                        <span>Until {new Date(pl.availability_end).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-slate-400">Always available</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span>Pause: {pl.allow_pausing ? "✅" : "❌"}</span>
                        <span>Early Close: {pl.allow_early_closure ? "✅" : "❌"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(pl.id, pl.is_active)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer ${
                          pl.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {pl.is_active ? "Active" : "Archived"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(pl)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit Plan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Edit Plan: {editingPlan.name}
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Plan Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Billing Cycle</label>
                  <select
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value as BillingFrequency)}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none capitalize"
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
                    required
                    value={editMinQty}
                    onChange={(e) => setEditMinQty(parseInt(e.target.value) || 1)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Availability Start</label>
                  <input
                    type="date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Availability End</label>
                  <input
                    type="date"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permission Toggles */}
              <div className="grid grid-cols-2 gap-2 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAllowPausing}
                    onChange={(e) => setEditAllowPausing(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Allow Pausing
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAllowEarlyClose}
                    onChange={(e) => setEditAllowEarlyClose(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Allow Early Close
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAutoClose}
                    onChange={(e) => setEditAutoClose(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Auto-close on Expiry
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAllowRenewal}
                    onChange={(e) => setEditAllowRenewal(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Allow Renewals
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="rounded border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
