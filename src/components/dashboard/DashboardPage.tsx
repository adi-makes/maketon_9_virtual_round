"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  RefreshCw,
  ChevronDown,
  UserPlus,
  Receipt,
  BarChart3,
  Plus,
  PlusCircle,
  Activity,
  ArrowRight,
  Wallet,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  CheckCircle2,
  Clock3,
  RotateCcw,
  X,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/billing/dashboard-service";
import { fetchDashboardMetricsAction } from "@/actions/dashboard";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { SubscriptionGrowthChart } from "@/components/charts/SubscriptionGrowthChart";
import { runBillingCycleAction } from "@/actions/invoices";

export interface DashboardPageProps {
  initialMetrics?: DashboardMetrics;
}

export function DashboardPage({ initialMetrics }: DashboardPageProps = {}) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics || null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunningBilling, setIsRunningBilling] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [selectedMetricView, setSelectedMetricView] = useState<"revenue" | "mrr" | "collected">("revenue");
  const [timeframe, setTimeframe] = useState<"monthly" | "quarterly">("monthly");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchDashboardMetricsAction();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRunBilling = async () => {
    setIsRunningBilling(true);
    setBillingMessage(null);
    try {
      const res = await runBillingCycleAction();
      if (res.success && res.data) {
        setBillingMessage(res.message || "Billing run completed successfully.");
        // Immediately fetch updated metrics to reflect new invoices & balances
        const fresh = await fetchDashboardMetricsAction();
        if (fresh.success && fresh.data) {
          setMetrics(fresh.data);
        }
      } else {
        setBillingMessage(res.error || "Billing run failed.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Billing run failed.";
      setBillingMessage(msg);
    } finally {
      setIsRunningBilling(false);
    }
  };

  // ─── Live Aggregations from authoritative metrics ───────────────────────────
  const totalRevenue = metrics?.totalRevenue ?? 0;
  const grossCollected = metrics?.grossCollected ?? 0;
  const invoicedRevenue = metrics?.invoicedRevenue ?? 0;
  const latestMRR = metrics?.mrr ?? 0;

  const activeSubscriptionsCount = metrics?.activeSubscriptionsCount ?? 0;
  const totalCustomersCount = metrics?.totalCustomersCount ?? 0;
  const outstandingBalance = metrics?.outstandingReceivables ?? 0;
  const overdueInvoicesCount = metrics?.overdueInvoicesCount ?? 0;

  const totalSubsCount = metrics?.totalSubscriptionsCount ?? 0;
  const activeSubs = metrics?.subscriptionDistribution?.active ?? 0;
  const confirmedSubs = metrics?.subscriptionDistribution?.confirmed ?? 0;
  const pausedSubs = metrics?.subscriptionDistribution?.paused ?? 0;
  const otherSubs = metrics?.subscriptionDistribution?.other ?? 0;

  const activePercent = metrics?.subscriptionDistribution?.activePercent ?? 0;
  const confirmedPercent = metrics?.subscriptionDistribution?.confirmedPercent ?? 0;
  const pausedPercent = metrics?.subscriptionDistribution?.pausedPercent ?? 0;
  const otherPercent = metrics?.subscriptionDistribution?.otherPercent ?? 0;

  const recentSubscriptions = metrics?.recentSubscriptions ?? [];
  const recentSettlements = metrics?.recentSettlements ?? [];
  const timeSeriesStats = metrics?.timeSeriesStats ?? [];

  // Helper currency formatter (INR format)
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full space-y-space-lg">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="space-y-1">
            <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-on-surface-variant uppercase tracking-wider text-xs">
              <span>Portfolio Analytics</span>
              <span>/</span>
              <span className="text-primary font-medium">Real-time Telemetry</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold text-2xl lg:text-3xl">
              Dashboard
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Authoritative revenue, subscription lifecycle, and billing telemetry from live Supabase ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            {/* Live Data Badge */}
            <div className="flex items-center bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              <span>Live Database</span>
            </div>

            {/* Currency Pill */}
            <div className="flex items-center bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm font-mono-data-sm text-mono-data-sm font-medium text-on-surface text-xs border border-surface-container-high/30">
              <span className="text-on-surface-variant mr-1.5">Curr:</span>
              <span className="text-on-surface font-semibold">INR (₹)</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg shadow-sm transition-all border border-surface-container-high/30"
              id="refreshDataBtn"
              title="Refresh Telemetry"
              type="button"
              aria-label="Refresh Telemetry"
            >
              <RefreshCw
                size={18}
                className={`transition-transform duration-500 ease-in-out ${
                  isRefreshing ? "rotate-180 text-primary animate-spin" : ""
                }`}
              />
            </button>

            {/* Quick Actions Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm transition-all text-xs font-semibold border border-surface-container-high/30"
                type="button"
              >
                <span>Quick Actions</span>
                <ChevronDown size={18} className="text-on-surface-variant" />
              </button>

              {quickActionsOpen && (
                <div
                  className="absolute right-0 mt-1 w-48 rounded-xl bg-surface-container-lowest shadow-xl py-1 z-30 border border-surface-container-high/50"
                  onClick={() => setQuickActionsOpen(false)}
                >
                  <Link
                    href="/customers"
                    className="flex items-center gap-2 px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container text-xs"
                  >
                    <UserPlus size={16} className="text-primary" />
                    <span>View Customers</span>
                  </Link>
                  <Link
                    href="/invoices"
                    className="flex items-center gap-2 px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container text-xs"
                  >
                    <Receipt size={16} className="text-primary" />
                    <span>Manage Invoices</span>
                  </Link>
                  <Link
                    href="/payments"
                    className="flex items-center gap-2 px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container text-xs"
                  >
                    <Wallet size={16} className="text-primary" />
                    <span>Manage Payments</span>
                  </Link>
                  <button
                    onClick={handleRunBilling}
                    className="w-full flex items-center gap-2 px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container text-xs text-left"
                    type="button"
                  >
                    <RefreshCw size={16} className="text-emerald-600" />
                    <span>Run Billing Cycle</span>
                  </button>
                </div>
              )}
            </div>

            {/* Run Billing Cycle Direct CTA */}
            <button
              onClick={handleRunBilling}
              disabled={isRunningBilling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-label-md shadow-sm transition-all text-xs font-semibold disabled:opacity-50"
              type="button"
            >
              <RefreshCw size={14} className={isRunningBilling ? "animate-spin" : ""} />
              <span>{isRunningBilling ? "Running..." : "Run Billing"}</span>
            </button>

            {/* Create Subscription CTA */}
            <Link
              href="/subscriptions/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md shadow-sm transition-all text-xs font-semibold"
            >
              <Plus size={16} />
              <span>Create Subscription</span>
            </Link>
          </div>
        </div>

        {/* Action Status Banner */}
        {billingMessage && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{billingMessage}</span>
            </div>
            <button
              onClick={() => setBillingMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Action Shortcut Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
          <Link
            href="/customers"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm transition-all text-left border border-surface-container-high/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <UserPlus size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface text-sm">
                  Customers
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  {totalCustomersCount} registered
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="text-on-surface-variant group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/subscriptions/new"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm transition-all text-left border border-surface-container-high/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <PlusCircle size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface text-sm">
                  New Subscription
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Provision billing contract
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="text-on-surface-variant group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/invoices"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm transition-all text-left border border-surface-container-high/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Receipt size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface text-sm">
                  Invoices
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  {overdueInvoicesCount > 0 ? `${overdueInvoicesCount} overdue` : "Ledger & balances"}
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="text-on-surface-variant group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/payments"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm transition-all text-left border border-surface-container-high/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Wallet size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface text-sm">
                  Payments
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  {formatINR(totalRevenue)} settled
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="text-on-surface-variant group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 6 Key Financial Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-sm">
          {/* Card 1: Total Revenue (Collected Net) */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                Total Collected
              </span>
              <div className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center text-primary">
                <Wallet size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-xl">
                {formatINR(totalRevenue)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  <ArrowUp size={12} className="mr-0.5" />
                  Net Settled
                </span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Gross: {formatINR(grossCollected)}
            </div>
          </div>

          {/* Card 2: MRR */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                MRR
              </span>
              <div className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center text-primary">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-xl">
                {formatINR(latestMRR)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  <ArrowUp size={12} className="mr-0.5" />
                  Normalized
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">active cohort</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              ARR: {formatINR(latestMRR * 12)}
            </div>
          </div>

          {/* Card 3: Active Subs */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                Active Subs
              </span>
              <div className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center text-primary">
                <RefreshCw size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-xl">
                {activeSubscriptionsCount}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-surface-container-high text-on-surface">
                  {totalSubsCount} total
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">contracts</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              {activePercent}% active lifecycle rate
            </div>
          </div>

          {/* Card 4: Total Customers */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                Total Customers
              </span>
              <div className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center text-primary">
                <Users size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-xl">
                {totalCustomersCount}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  <ArrowUp size={12} className="mr-0.5" />
                  Registered
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">accounts</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Live database records
            </div>
          </div>

          {/* Card 5: Outstanding Receivables */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                Outstanding
              </span>
              <div className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center text-secondary">
                <Clock size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-xl">
                {formatINR(outstandingBalance)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700">
                  Unpaid
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">receivables</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Invoiced: {formatINR(invoicedRevenue)}
            </div>
          </div>

          {/* Card 6: Overdue Invoices */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-error uppercase tracking-wider font-semibold text-[11px]">
                Overdue Invoices
              </span>
              <div className="w-7 h-7 rounded-md bg-error-container flex items-center justify-center text-error">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="font-mono-data-lg text-mono-data-lg text-error font-semibold tracking-tight text-xl">
                {overdueInvoicesCount}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-error-container text-on-error-container">
                  Past due
                </span>
                <span className="font-body-sm text-body-sm text-error text-xs">&gt;0 balance</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Actionable balance items
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          {/* Revenue Trajectory (8 cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-surface-container-high/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface text-lg">
                    Revenue Trajectory &amp; Expansion
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-data-sm bg-surface-container-high text-primary font-semibold">
                    LIVE
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Real payment collections and MRR time-series
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg bg-surface-container-low p-1">
                  <button
                    onClick={() => setSelectedMetricView("revenue")}
                    className={`px-2.5 py-1 rounded-md text-label-sm font-label-md text-xs font-medium transition-all ${
                      selectedMetricView === "revenue"
                        ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Net Revenue
                  </button>
                  <button
                    onClick={() => setSelectedMetricView("mrr")}
                    className={`px-2.5 py-1 rounded-md text-label-sm font-label-md text-xs font-medium transition-all ${
                      selectedMetricView === "mrr"
                        ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    MRR
                  </button>
                  <button
                    onClick={() => setSelectedMetricView("collected")}
                    className={`px-2.5 py-1 rounded-md text-label-sm font-label-md text-xs font-medium transition-all ${
                      selectedMetricView === "collected"
                        ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Collected
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Revenue Trend Area Chart */}
            <div className="py-2">
              <RevenueTrendChart
                data={timeSeriesStats}
                metricKey={selectedMetricView === "revenue" ? "net_revenue" : selectedMetricView}
                height={288}
              />
            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-between pt-space-sm gap-space-sm font-label-sm text-label-sm text-xs">
              <div className="flex flex-wrap items-center gap-space-md">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-on-surface">Monthly Recurring Revenue (MRR)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#006693]" />
                  <span className="text-on-surface-variant">Net Settled Payments</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                <span>Data Source:</span>
                <span className="text-primary font-semibold">Supabase PostgreSQL</span>
              </div>
            </div>
          </div>

          {/* Subscription Growth & Plan Distribution (4 cols) */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-surface-container-high/20">
            <div className="flex items-center justify-between pb-space-sm">
              <div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface text-lg">
                  Subscription Growth
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Active contracts &amp; {totalSubsCount} total subscriptions
                </p>
              </div>
            </div>

            {/* Recharts Subscription Growth Bar Chart */}
            <div className="my-2">
              <SubscriptionGrowthChart data={timeSeriesStats} height={190} />
            </div>

            {/* Legend with Progress Bars */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-label-md text-label-md text-xs">
                  <span className="flex items-center gap-2 text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />
                    Active Plans
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
                      {activeSubs}
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      {activePercent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4f46e5] h-full rounded-full" style={{ width: `${activePercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between font-label-md text-label-md text-xs">
                  <span className="flex items-center gap-2 text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
                    Confirmed
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
                      {confirmedSubs}
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      {confirmedPercent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#0ea5e9] h-full rounded-full" style={{ width: `${confirmedPercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between font-label-md text-label-md text-xs">
                  <span className="flex items-center gap-2 text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
                    Paused
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
                      {pausedSubs}
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      {pausedPercent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#94a3b8] h-full rounded-full" style={{ width: `${pausedPercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between font-label-md text-label-md text-xs">
                  <span className="flex items-center gap-2 text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
                    Draft / Closed
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
                      {otherSubs}
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      {otherPercent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#f43f5e] h-full rounded-full" style={{ width: `${otherPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables Section (Recent Subscriptions & Recent Settlements) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
          {/* Table 1: Recent Subscriptions */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-container-high/20">
            <div className="p-space-md flex items-center justify-between bg-surface-container-lowest border-b border-surface-container-high/20">
              <div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface text-base">
                  Recent Subscriptions
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Live cohort additions and recurring contracts
                </p>
              </div>
              <Link
                href="/subscriptions"
                className="font-label-md text-label-md text-primary hover:text-primary-container font-semibold flex items-center gap-1 text-xs"
              >
                <span>View all</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Plan</th>
                    <th className="py-2.5 px-3 font-semibold">Start Date</th>
                    <th className="py-2.5 px-3 font-semibold">Next Cycle</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm divide-y-0 text-xs">
                  {recentSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-on-surface-variant font-body-sm text-xs">
                        No subscriptions registered yet.{" "}
                        <Link href="/subscriptions/new" className="text-primary font-semibold hover:underline">
                          Create your first subscription
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    recentSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-surface-container-low transition-colors border-b border-surface-container-high/10">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center font-mono-data-sm text-[11px] font-bold text-primary">
                              {sub.customer_initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                                {sub.customer_name}
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-[11px]">
                                {sub.customer_email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-label-md text-label-md text-on-surface font-medium">
                            {sub.plan_name}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {formatDate(sub.start_date)}
                        </td>
                        <td className="py-3 px-3 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {formatDate(sub.next_billing_date)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
                          {formatINR(sub.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {sub.status === "active" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Active
                            </span>
                          ) : sub.status === "paused" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Paused
                            </span>
                          ) : sub.status === "confirmed" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface">
                              <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
                              Confirmed
                            </span>
                          ) : sub.status === "closed" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              {sub.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Recent Settlements */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-container-high/20">
            <div className="p-space-md flex items-center justify-between bg-surface-container-lowest border-b border-surface-container-high/20">
              <div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface text-base">
                  Recent Settlements
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Gateways, ledger &amp; instant reconciliations
                </p>
              </div>
              <Link
                href="/payments"
                className="font-label-md text-label-md text-primary hover:text-primary-container font-semibold flex items-center gap-1 text-xs"
              >
                <span>View all</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Txn Number</th>
                    <th className="py-2.5 px-3 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Invoice</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-3 font-semibold">Settled Date</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm divide-y-0 text-xs">
                  {recentSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-on-surface-variant font-body-sm text-xs">
                        No payment settlements recorded yet.{" "}
                        <Link href="/payments" className="text-primary font-semibold hover:underline">
                          Record an invoice payment
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    recentSettlements.map((pay) => (
                      <tr key={pay.id} className="hover:bg-surface-container-low transition-colors border-b border-surface-container-high/10">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {pay.status === "completed" ? (
                              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                            ) : pay.status === "pending" ? (
                              <Clock3 size={16} className="text-amber-600 flex-shrink-0" />
                            ) : pay.status === "refunded" ? (
                              <RotateCcw size={16} className="text-rose-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle size={16} className="text-error flex-shrink-0" />
                            )}
                            <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
                              {pay.payment_number}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-label-md text-label-md text-on-surface font-medium">
                            {pay.customer_name}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono-data-sm text-mono-data-sm text-primary">
                          <Link href={`/invoices`} className="hover:underline">
                            {pay.invoice_number}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
                          {formatINR(pay.amount)}
                        </td>
                        <td className="py-3 px-3 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {formatDate(pay.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {pay.status === "completed" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                              Settled
                            </span>
                          ) : pay.status === "pending" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                              Processing
                            </span>
                          ) : pay.status === "refunded" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">
                              Refunded
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-error-container text-on-error-container">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
