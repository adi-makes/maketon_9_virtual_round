"use client";

import { useState } from "react";
import Link from "next/link";
import {
  transitionSubscriptionStatus,
  toggleCancelAtPeriodEnd,
} from "@/actions/subscriptions";
import { ALLOWED_TRANSITIONS } from "@/lib/subscriptions/transitions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SubscriptionStatus } from "@/types";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  company_name?: string | null;
  phone?: string | null;
}

interface PlanData {
  id: string;
  name: string;
  billing_frequency: "monthly" | "yearly";
  interval_count: number;
  product?: {
    id: string;
    name: string;
    base_price: number;
  };
}

interface ItemData {
  id: string;
  quantity: number;
  unit_price: number;
  variant?: {
    id: string;
    name: string;
    price_adjustment: number;
    sku?: string | null;
  } | null;
}

interface SubscriptionDetailProps {
  subscription: {
    id: string;
    status: SubscriptionStatus;
    start_date: string;
    current_period_start: string | null;
    current_period_end: string | null;
    next_billing_date: string | null;
    cancel_at_period_end: boolean;
    customer: CustomerData | null;
    plan: PlanData | null;
    items: ItemData[];
  };
}

const LIFECYCLE_STEPS: SubscriptionStatus[] = [
  "draft",
  "quotation",
  "confirmed",
  "active",
  "paused",
  "closed",
];

export function SubscriptionDetailClient({ subscription: initialSub }: SubscriptionDetailProps) {
  const [sub, setSub] = useState(initialSub);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Manual transition tester state
  const [testTargetStatus, setTestTargetStatus] = useState<SubscriptionStatus>("active");

  const currentStatus = sub.status;
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

  const handleTransition = async (nextStatus: SubscriptionStatus) => {
    setFeedback(null);
    setIsPending(true);
    try {
      const res = await transitionSubscriptionStatus(sub.id, nextStatus);
      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Transition failed.",
        });
      } else {
        setFeedback({
          type: "success",
          message: res.message || `Status successfully transitioned to ${nextStatus}.`,
        });
        setSub((prev) => ({
          ...prev,
          status: nextStatus,
          // If activated, refresh period estimate locally
          ...(nextStatus === "active" && !prev.current_period_start
            ? {
                current_period_start: new Date().toISOString(),
                next_billing_date: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toISOString(),
              }
            : {}),
        }));
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Internal error occurred.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleCancel = async () => {
    setFeedback(null);
    setIsPending(true);
    const nextVal = !sub.cancel_at_period_end;
    try {
      const res = await toggleCancelAtPeriodEnd(sub.id, nextVal);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update cancellation." });
      } else {
        setFeedback({ type: "success", message: res.message || "Cancellation policy updated." });
        setSub((prev) => ({ ...prev, cancel_at_period_end: nextVal }));
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error" });
    } finally {
      setIsPending(false);
    }
  };

  const totalRecurring = sub.items.reduce(
    (acc, it) => acc + Number(it.unit_price) * Number(it.quantity),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/subscriptions" className="hover:underline">
              Subscriptions
            </Link>
            <span>/</span>
            <span className="font-mono text-xs">{sub.id.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Subscription Lifecycle
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                currentStatus === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : currentStatus === "confirmed"
                  ? "bg-blue-100 text-blue-800"
                  : currentStatus === "quotation"
                  ? "bg-amber-100 text-amber-800"
                  : currentStatus === "paused"
                  ? "bg-orange-100 text-orange-800"
                  : currentStatus === "closed"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {currentStatus}
            </span>
            {sub.cancel_at_period_end && (
              <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                Cancel at period end
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPending || currentStatus === "closed"}
            onClick={handleToggleCancel}
            className={`rounded-md border px-3 py-2 text-xs font-medium shadow-sm disabled:opacity-50 ${
              sub.cancel_at_period_end
                ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                : "border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
            }`}
          >
            {sub.cancel_at_period_end ? "Undo Cancellation" : "Cancel at Period End"}
          </button>
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
          <strong>{feedback.type === "success" ? "Success:" : "State Machine Error:"}</strong>{" "}
          {feedback.message}
        </div>
      )}

      {/* Lifecycle Stepper Graphic */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Lifecycle State Machine Progression
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCurrent = step === currentStatus;
            const isAllowedNext = allowedNext.includes(step);
            return (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                    isCurrent
                      ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900 ring-offset-2"
                      : isAllowedNext
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step}
                </span>
                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <span className="text-slate-300 font-bold">&rarr;</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Transition Actions */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-slate-700">
                Permitted Status Actions:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {allowedNext.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    Subscription is in terminal state ({currentStatus}). No further transitions allowed.
                  </span>
                ) : (
                  allowedNext.map((target) => (
                    <button
                      key={target}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleTransition(target)}
                      className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 capitalize"
                    >
                      {target === "active"
                        ? "Activate Subscription (Set Renewal Dates)"
                        : `Move to ${target}`}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Test Guard Tool */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 sm:max-w-xs">
              <span className="block text-xs font-semibold text-slate-700">
                Guard Validation Tester:
              </span>
              <p className="text-[11px] text-slate-500 mb-2">
                Test invalid state transition exceptions (e.g. closed &rarr; active).
              </p>
              <div className="flex gap-2">
                <select
                  value={testTargetStatus}
                  onChange={(e) => setTestTargetStatus(e.target.value as SubscriptionStatus)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                >
                  {LIFECYCLE_STEPS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleTransition(testTargetStatus)}
                  className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Attempt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Details Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Customer & Plan Details */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Customer & Account Info
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Customer Name</span>
              <span className="font-semibold text-slate-900">
                {sub.customer?.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Email Address</span>
              <span className="text-slate-700">{sub.customer?.email || "N/A"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Company</span>
              <span className="text-slate-700">
                {sub.customer?.company_name || "Personal Account"}
              </span>
            </div>
            {sub.customer?.phone && (
              <div>
                <span className="text-xs text-slate-500 block">Phone</span>
                <span className="text-slate-700">{sub.customer.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule & Renewal Dates */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Billing Schedule & Renewal
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Start Date</span>
              <span className="font-medium text-slate-800">
                {formatDate(sub.start_date)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Billing Frequency</span>
              <span className="font-medium text-slate-800 capitalize">
                {sub.plan?.billing_frequency || "Monthly"} (Interval: {sub.plan?.interval_count || 1})
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Current Period Start</span>
              <span className="font-medium text-slate-800">
                {sub.current_period_start ? (
                  formatDate(sub.current_period_start)
                ) : (
                  <span className="text-xs text-slate-400">Not activated</span>
                )}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Next Billing / Renewal Date</span>
              <span className="font-semibold text-blue-600">
                {sub.next_billing_date ? (
                  formatDate(sub.next_billing_date)
                ) : (
                  <span className="text-xs text-slate-400">Pending activation</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Line Items */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Subscription Items & Variant Pricing
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Plan: {sub.plan?.name}
          </span>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Product / Variant Tier</th>
              <th className="px-6 py-3">Base Price</th>
              <th className="px-6 py-3">Variant Price Adjustment</th>
              <th className="px-6 py-3">Calculated Unit Price</th>
              <th className="px-6 py-3">Quantity</th>
              <th className="px-6 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sub.items.map((item) => {
              const basePrice = Number(sub.plan?.product?.base_price || 0);
              const priceAdj = Number(item.variant?.price_adjustment || 0);
              const unitPrice = Number(item.unit_price);
              const subtotal = unitPrice * Number(item.quantity);

              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {sub.plan?.product?.name || "Product"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.variant ? `Variant: ${item.variant.name}` : "Standard Tier (No Variant)"}
                      {item.variant?.sku ? ` • SKU: ${item.variant.sku}` : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {formatCurrency(basePrice)}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {priceAdj >= 0 ? "+" : ""}
                    {formatCurrency(priceAdj)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-blue-600">
                    {formatCurrency(unitPrice)}
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-medium">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {formatCurrency(subtotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold text-slate-900">
            <tr>
              <td colSpan={5} className="px-6 py-4 text-right">
                Recurring Total Per Interval:
              </td>
              <td className="px-6 py-4 text-right text-lg text-slate-900">
                {formatCurrency(totalRecurring)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

