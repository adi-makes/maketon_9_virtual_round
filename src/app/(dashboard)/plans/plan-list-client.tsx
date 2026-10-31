"use client";

import { useState } from "react";
import Link from "next/link";
import { createPlan, togglePlanStatus } from "@/actions/products";
import { formatCurrency } from "@/lib/utils";

interface PlanItem {
  id: string;
  name: string;
  billing_frequency: "monthly" | "yearly";
  interval_count: number;
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
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "yearly">("monthly");
  const [intervalCount, setIntervalCount] = useState<number>(1);
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
      setMessage({ type: "error", text: "Please enter a plan name." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPlan({
        product_id: selectedProductId,
        name: name.trim(),
        billing_frequency: frequency,
        interval_count: Number(intervalCount) || 1,
        is_active: true,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Failed to create plan." });
      } else {
        setMessage({ type: "success", text: "Billing plan created successfully!" });
        setName("");
        setIntervalCount(1);
        // Refresh local state
        const targetProd = products.find((p) => p.id === selectedProductId);
        if (res.data?.id && targetProd) {
          setPlans([
            {
              id: res.data.id,
              name: name.trim(),
              billing_frequency: frequency,
              interval_count: Number(intervalCount) || 1,
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
            Configure monthly and annual billing cycles across all catalog products.
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
          Associate a recurring frequency with any existing product in the catalog.
        </p>
        <form onSubmit={handleCreatePlan} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
              placeholder="e.g. Quarterly Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Billing Interval
            </label>
            <div className="flex gap-2">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as "monthly" | "yearly")}
                className="w-2/3 rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
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

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting || products.length === 0}
              className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
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
            <button
              onClick={() => setFilterFrequency("all")}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                filterFrequency === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All ({plans.length})
            </button>
            <button
              onClick={() => setFilterFrequency("monthly")}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                filterFrequency === "monthly"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Monthly ({plans.filter((p) => p.billing_frequency === "monthly").length})
            </button>
            <button
              onClick={() => setFilterFrequency("yearly")}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                filterFrequency === "yearly"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Yearly ({plans.filter((p) => p.billing_frequency === "yearly").length})
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Plan Name</th>
                <th className="px-6 py-3">Associated Product</th>
                <th className="px-6 py-3">Frequency & Interval</th>
                <th className="px-6 py-3">Base Price</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No billing plans found for this selection.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((pl) => (
                  <tr key={pl.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{pl.name}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/products/${pl.product?.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {pl.product?.name || "Unknown Product"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600 capitalize">
                      {pl.billing_frequency} (every {pl.interval_count}{" "}
                      {pl.billing_frequency === "yearly" ? "year" : "month"}
                      {pl.interval_count > 1 ? "s" : ""})
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatCurrency(Number(pl.product?.base_price || 0))}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          pl.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {pl.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggle(pl.id, pl.is_active)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
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
      </div>
    </div>
  );
}

