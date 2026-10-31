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
} from "lucide-react";
import {
  mockCustomers,
  mockSubscriptions,
  mockSubscriptionItems,
  mockInvoices,
  mockPayments,
  mockPlans,
  mockRevenueStats,
} from "@/lib/mock-data";

export function DashboardView() {
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetricView, setSelectedMetricView] = useState<
    "revenue" | "mrr" | "collected"
  >("revenue");
  const [timeframe, setTimeframe] = useState<"monthly" | "quarterly">("monthly");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // ─── Dynamic Aggregations from mockData ─────────────────────────────────────
  const totalRevenue = mockPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const latestMRR =
    mockRevenueStats[mockRevenueStats.length - 1]?.mrr ?? 1655.5;

  const activeSubscriptionsCount = mockSubscriptions.filter(
    (s) => s.status === "active"
  ).length;

  const totalCustomersCount = mockCustomers.length;

  const outstandingBalance = mockInvoices.reduce(
    (sum, inv) => sum + inv.outstanding_balance,
    0
  );

  const overdueInvoicesCount = mockInvoices.filter(
    (inv) =>
      inv.outstanding_balance > 0 &&
      inv.status !== "paid" &&
      inv.status !== "cancelled"
  ).length;

  // Plan Distribution breakdown
  const totalSubsCount = mockSubscriptions.length || 1;
  const activeSubs = mockSubscriptions.filter((s) => s.status === "active").length;
  const confirmedSubs = mockSubscriptions.filter(
    (s) => s.status === "confirmed"
  ).length;
  const pausedSubs = mockSubscriptions.filter((s) => s.status === "paused").length;
  const otherSubs = mockSubscriptions.filter(
    (s) => s.status === "draft" || s.status === "closed"
  ).length;

  const activePercent = Math.round((activeSubs / totalSubsCount) * 100);
  const confirmedPercent = Math.round((confirmedSubs / totalSubsCount) * 100);
  const pausedPercent = Math.round((pausedSubs / totalSubsCount) * 100);
  const otherPercent = Math.max(
    0,
    100 - activePercent - confirmedPercent - pausedPercent
  );

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col w-full space-y-6">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-mono text-slate-500 uppercase tracking-wider text-xs">
              <span>Portfolio Analytics</span>
              <span>/</span>
              <span className="text-indigo-600 font-medium">Real-time Stream</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              Executive Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Monitor your subscription business and financial performance across active cohorts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Selector */}
            <div className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
              <Calendar size={16} className="text-slate-400 mr-2" />
              <span className="text-slate-700 font-medium text-xs">
                Oct 1 - Oct 31, 2026
              </span>
              <span className="mx-2 text-slate-300 text-xs">|</span>
              <span className="text-indigo-600 font-semibold text-xs">
                Last 30 Days
              </span>
            </div>

            {/* Currency Pill */}
            <div className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm font-mono text-xs font-medium text-slate-700 border border-slate-200">
              <span className="text-slate-400 mr-1.5">Curr:</span>
              <span className="text-slate-900 font-semibold">INR (₹)</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-lg shadow-sm transition-all border border-slate-200"
              id="refreshDataBtn"
              title="Refresh Telemetry"
              type="button"
              aria-label="Refresh Telemetry"
            >
              <RefreshCw
                size={16}
                className={`transition-transform duration-500 ease-in-out ${
                  isRefreshing ? "rotate-180 text-indigo-600" : ""
                }`}
              />
            </button>

            {/* Quick Actions Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all text-xs font-semibold border border-slate-200"
                type="button"
              >
                <span>Quick Actions</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {quickActionsOpen && (
                <div
                  className="absolute right-0 mt-1 w-48 rounded-xl bg-white shadow-xl py-1 z-30 border border-slate-200"
                  onClick={() => setQuickActionsOpen(false)}
                >
                  <Link
                    href="/subscriptions/new"
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-xs"
                  >
                    <PlusCircle size={16} className="text-indigo-600" />
                    <span>Create Subscription</span>
                  </Link>
                  <Link
                    href="/invoices"
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-xs"
                  >
                    <Receipt size={16} className="text-indigo-600" />
                    <span>View Invoices</span>
                  </Link>
                  <Link
                    href="/payments"
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-xs"
                  >
                    <BarChart3 size={16} className="text-indigo-600" />
                    <span>Payment Ledger</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Create Subscription CTA */}
            <Link
              href="/subscriptions/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all text-xs font-semibold"
            >
              <Plus size={16} />
              <span>Create Subscription</span>
            </Link>
          </div>
        </div>

        {/* Action Shortcut Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/customers"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-white hover:bg-slate-50/80 shadow-sm transition-all text-left border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <UserPlus size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-sm">
                  Customers
                </span>
                <span className="text-slate-500 text-xs">
                  Directory &amp; accounts
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/subscriptions/new"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-white hover:bg-slate-50/80 shadow-sm transition-all text-left border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <PlusCircle size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-sm">
                  New Subscription
                </span>
                <span className="text-slate-500 text-xs">
                  Provision billing cycle
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/invoices"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-white hover:bg-slate-50/80 shadow-sm transition-all text-left border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <Receipt size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-sm">
                  Invoices
                </span>
                <span className="text-slate-500 text-xs">
                  Cycle runs &amp; dues
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/payments"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-white hover:bg-slate-50/80 shadow-sm transition-all text-left border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <Activity size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-sm">
                  Payments
                </span>
                <span className="text-slate-500 text-xs">
                  Settlements &amp; ledger
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 6 Key Financial Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Total Revenue */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider font-semibold text-[11px] text-slate-500">
                Total Revenue
              </span>
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-indigo-600">
                <Wallet size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-slate-900 font-semibold tracking-tight text-xl font-mono">
                {formatINR(totalRevenue)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  <ArrowUp size={12} className="mr-0.5" />
                  +14.2%
                </span>
                <span className="text-slate-500 text-xs">vs last month</span>
              </div>
            </div>
            <div className="text-slate-500 truncate text-xs">
              Gross settled ({mockPayments.length} transactions)
            </div>
          </div>

          {/* Card 2: MRR */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider font-semibold text-[11px] text-slate-500">
                MRR
              </span>
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-indigo-600">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-slate-900 font-semibold tracking-tight text-xl font-mono">
                {formatINR(latestMRR)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  <ArrowUp size={12} className="mr-0.5" />
                  +8.6%
                </span>
                <span className="text-slate-500 text-xs">vs last month</span>
              </div>
            </div>
            <div className="text-slate-500 truncate text-xs">
              Run-rate: {formatINR(latestMRR * 12)}
            </div>
          </div>

          {/* Card 3: Active Subs */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider font-semibold text-[11px] text-slate-500">
                Active Subs
              </span>
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-indigo-600">
                <RefreshCw size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-slate-900 font-semibold tracking-tight text-xl font-mono">
                {activeSubscriptionsCount}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                  +{mockSubscriptions.length} total
                </span>
                <span className="text-slate-500 text-xs">in cohort</span>
              </div>
            </div>
            <div className="text-slate-500 truncate text-xs">
              {activePercent}% active lifecycle rate
            </div>
          </div>

          {/* Card 4: Total Customers */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider font-semibold text-[11px] text-slate-500">
                Total Customers
              </span>
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-indigo-600">
                <Users size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-slate-900 font-semibold tracking-tight text-xl font-mono">
                {totalCustomersCount}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  <ArrowUp size={12} className="mr-0.5" />
                  +100% net
                </span>
                <span className="text-slate-500 text-xs">retention</span>
              </div>
            </div>
            <div className="text-slate-500 truncate text-xs">
              Across 5 global territories
            </div>
          </div>

          {/* Card 5: Outstanding Balance */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider font-semibold text-[11px] text-slate-500">
                Outstanding
              </span>
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-sky-600">
                <Clock size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-slate-900 font-semibold tracking-tight text-xl font-mono">
                {formatINR(outstandingBalance)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  <ArrowDown size={12} className="mr-0.5" />
                  -4.3%
                </span>
                <span className="text-slate-500 text-xs">vs last month</span>
              </div>
            </div>
            <div className="text-slate-500 truncate text-xs">
              Pending in {overdueInvoicesCount} invoices
            </div>
          </div>

          {/* Card 6: Overdue Invoices */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider font-semibold text-[11px] text-rose-600">
                Overdue Invoices
              </span>
              <div className="w-7 h-7 rounded-md bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="my-3">
              <div className="text-slate-900 font-semibold tracking-tight text-xl font-mono">
                {overdueInvoicesCount}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700">
                  Critical AR
                </span>
                <span className="text-slate-500 text-xs">needs follow-up</span>
              </div>
            </div>
            <div className="text-slate-500 truncate text-xs">
              Total {formatINR(outstandingBalance)}
            </div>
          </div>
        </div>

        {/* Visual Charts & Breakdown Section (8 cols + 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SVG Visual Chart (8 cols) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-sm flex flex-col justify-between border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Revenue &amp; MRR Performance
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-600 font-semibold">
                    10-Month Trend
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Gross invoice collections vs net monthly recurring run-rate
                </p>
              </div>

              {/* View & Period Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button
                    onClick={() => setSelectedMetricView("revenue")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedMetricView === "revenue"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    onClick={() => setSelectedMetricView("mrr")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedMetricView === "mrr"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    MRR (₹)
                  </button>
                  <button
                    onClick={() => setSelectedMetricView("collected")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedMetricView === "collected"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Collected
                  </button>
                </div>
                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button
                    onClick={() => setTimeframe("monthly")}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      timeframe === "monthly"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setTimeframe("quarterly")}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      timeframe === "quarterly"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Quarterly
                  </button>
                </div>
              </div>
            </div>

            {/* SVG Visual Chart */}
            <div className="relative w-full h-72 py-2">
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 760 260"
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
                    <stop offset="90%" stopColor="#4f46e5" stopOpacity="0.01" />
                  </linearGradient>
                  <linearGradient id="secondaryGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines & axis markers */}
                <line stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="740" y1="20" y2="20" />
                <text className="fill-slate-400 font-mono text-[11px]" textAnchor="end" x="32" y="24">
                  14L
                </text>
                <line stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="740" y1="75" y2="75" />
                <text className="fill-slate-400 font-mono text-[11px]" textAnchor="end" x="32" y="79">
                  10.5L
                </text>
                <line stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="740" y1="130" y2="130" />
                <text className="fill-slate-400 font-mono text-[11px]" textAnchor="end" x="32" y="134">
                  7.0L
                </text>
                <line stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="740" y1="185" y2="185" />
                <text className="fill-slate-400 font-mono text-[11px]" textAnchor="end" x="32" y="189">
                  3.5L
                </text>
                <line stroke="#e2e8f0" strokeWidth="1" x1="40" x2="740" y1="230" y2="230" />
                <text className="fill-slate-400 font-mono text-[11px]" textAnchor="end" x="32" y="234">
                  0
                </text>

                {/* Gradient Polygons */}
                <polygon
                  fill="url(#revenueGradient)"
                  points="50,230 50,195 125,185 200,165 275,150 350,140 425,115 500,90 575,80 650,60 725,35 725,230"
                />
                <polygon
                  fill="url(#secondaryGradient)"
                  points="50,230 50,215 125,210 200,195 275,188 350,175 425,160 500,145 575,138 650,120 725,105 725,230"
                />

                {/* Trajectory Stroke Lines */}
                <path
                  d="M 50 215 L 125 210 L 200 195 L 275 188 L 350 175 L 425 160 L 500 145 L 575 138 L 650 120 L 725 105"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                <path
                  d="M 50 195 L 125 185 L 200 165 L 275 150 L 350 140 L 425 115 L 500 90 L 575 80 L 650 60 L 725 35"
                  fill="none"
                  stroke="#4f46e5"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />

                {/* Point Circles */}
                <circle cx="50" cy="195" fill="#ffffff" r="3.5" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="125" cy="185" fill="#ffffff" r="3.5" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="200" cy="165" fill="#ffffff" r="3.5" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="275" cy="150" fill="#ffffff" r="3.5" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="350" cy="140" fill="#ffffff" r="3.5" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="425" cy="115" fill="#ffffff" r="3.5" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="500" cy="90" fill="#ffffff" r="3.5" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="575" cy="80" fill="#ffffff" r="3.5" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="650" cy="60" fill="#ffffff" r="3.5" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="725" cy="35" fill="#4f46e5" r="5" stroke="#ffffff" strokeWidth="2" />

                {/* Month labels */}
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, idx) => (
                  <text
                    key={m}
                    className={`font-mono text-[11px] ${
                      idx === 9 ? "fill-indigo-600 font-bold" : "fill-slate-400"
                    }`}
                    textAnchor="middle"
                    x={50 + idx * 75}
                    y="248"
                  >
                    {m}
                  </text>
                ))}
              </svg>

              {/* Peak Floating Tooltip */}
              <div className="absolute right-4 top-2 bg-slate-900 text-white p-2.5 rounded-lg shadow-xl pointer-events-none transform -translate-y-2">
                <div className="flex items-center justify-between gap-3 text-xs mb-1">
                  <span className="font-mono text-indigo-300">Oct Peak Settled</span>
                  <span className="font-mono font-bold text-white">{formatINR(totalRevenue)}</span>
                </div>
                <div className="flex flex-col text-[11px] text-slate-300 space-y-0.5">
                  <div className="flex justify-between gap-2">
                    <span>Active MRR:</span>
                    <span className="text-white font-mono">{formatINR(latestMRR)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Active Subscriptions:</span>
                    <span className="text-white font-mono">{activeSubscriptionsCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Legend & Accuracy */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600" />
                  <span className="text-slate-900 font-medium">Net Recurring Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500" />
                  <span className="text-slate-500">Expansion Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-slate-500">One-time Setup Fees</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono text-slate-500">
                <span>Target Accuracy:</span>
                <span className="text-indigo-600 font-semibold">99.98%</span>
              </div>
            </div>
          </div>

          {/* Plan Distribution (4 cols) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm flex flex-col justify-between border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  Plan Distribution
                </h2>
                <p className="text-slate-500 text-xs">
                  {totalSubsCount} total accounts by status
                </p>
              </div>
              <button
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
                type="button"
                aria-label="Options"
              >
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Circular Donut Diagram */}
            <div className="flex items-center justify-center my-4 relative">
              <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 160 160">
                <circle cx="80" cy="80" fill="transparent" r="62" stroke="#f1f5f9" strokeWidth="16" />
                <circle
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="62"
                  stroke="#4f46e5"
                  strokeDasharray="286.2 389.5"
                  strokeDashoffset="0"
                  strokeWidth="16"
                />
                <circle
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="62"
                  stroke="#0ea5e9"
                  strokeDasharray="59.6 389.5"
                  strokeDashoffset="-286.2"
                  strokeWidth="16"
                />
                <circle
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="62"
                  stroke="#94a3b8"
                  strokeDasharray="25.3 389.5"
                  strokeDashoffset="-345.8"
                  strokeWidth="16"
                />
                <circle
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="62"
                  stroke="#f43f5e"
                  strokeDasharray="18.4 389.5"
                  strokeDashoffset="-371.1"
                  strokeWidth="16"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono font-bold text-slate-900 tracking-tight text-2xl">
                  {totalSubsCount}
                </span>
                <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  Subscriptions
                </span>
              </div>
            </div>

            {/* Legend with Progress Bars */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />
                    Active Plans
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900">
                      {activeSubs}
                    </span>
                    <span className="font-mono text-slate-500">
                      {activePercent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4f46e5] h-full rounded-full" style={{ width: `${activePercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
                    Confirmed
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900">
                      {confirmedSubs}
                    </span>
                    <span className="font-mono text-slate-500">
                      {confirmedPercent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#0ea5e9] h-full rounded-full" style={{ width: `${confirmedPercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
                    Paused
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900">
                      {pausedSubs}
                    </span>
                    <span className="font-mono text-slate-500">
                      {pausedPercent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#94a3b8] h-full rounded-full" style={{ width: `${pausedPercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
                    Draft / Closed
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900">
                      {otherSubs}
                    </span>
                    <span className="font-mono text-slate-500">
                      {otherPercent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#f43f5e] h-full rounded-full" style={{ width: `${otherPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables Section (Recent Subscriptions & Recent Settlements) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 1: Recent Subscriptions */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-slate-200">
            <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Recent Subscriptions
                </h2>
                <p className="text-slate-500 text-xs">
                  Real-time cohort creations and recurring contracts
                </p>
              </div>
              <Link
                href="/subscriptions"
                className="text-indigo-600 hover:text-indigo-500 font-semibold flex items-center gap-1 text-xs"
              >
                <span>View all</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 uppercase tracking-wider text-[11px] text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Plan</th>
                    <th className="py-2.5 px-3 font-semibold">Start Date</th>
                    <th className="py-2.5 px-3 font-semibold">Next Cycle</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {mockSubscriptions.slice(0, 5).map((sub) => {
                    const customer = mockCustomers.find((c) => c.id === sub.customer_id);
                    const plan = mockPlans.find((p) => p.id === sub.plan_id);
                    const items = mockSubscriptionItems.filter(
                      (i) => i.subscription_id === sub.id
                    );
                    const amount = items.reduce(
                      (sum, item) => sum + item.quantity * item.unit_price,
                      0
                    );

                    const displayName =
                      customer?.company_name || customer?.name || "Customer";
                    const email = customer?.email || "billing@client.com";
                    const initials = getInitials(displayName);

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center font-mono text-[11px] font-bold text-indigo-600">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 truncate">
                                {displayName}
                              </span>
                              <span className="text-slate-500 truncate text-[11px]">
                                {email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-700 font-medium">
                            {plan?.name || "Standard Plan"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {formatDate(sub.start_date)}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {formatDate(sub.next_billing_date)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatINR(amount || 99)}
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Recent Settlements */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-slate-200">
            <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Recent Settlements
                </h2>
                <p className="text-slate-500 text-xs">
                  Gateways, mandates &amp; instant reconciliations
                </p>
              </div>
              <Link
                href="/payments"
                className="text-indigo-600 hover:text-indigo-500 font-semibold flex items-center gap-1 text-xs"
              >
                <span>View all</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 uppercase tracking-wider text-[11px] text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Txn Reference</th>
                    <th className="py-2.5 px-3 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Invoice</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-3 font-semibold">Settled Date</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {mockPayments.slice(0, 5).map((pay) => {
                    const customer = mockCustomers.find(
                      (c) => c.id === pay.customer_id
                    );
                    const invoice = mockInvoices.find(
                      (i) => i.id === pay.invoice_id
                    );
                    const displayName =
                      customer?.company_name || customer?.name || "Customer";

                    return (
                      <tr
                        key={pay.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {pay.status === "completed" ? (
                              <CheckCircle2
                                size={16}
                                className="text-emerald-600 flex-shrink-0"
                              />
                            ) : pay.status === "pending" ? (
                              <Clock3
                                size={16}
                                className="text-amber-600 flex-shrink-0"
                              />
                            ) : pay.status === "refunded" ? (
                              <RotateCcw
                                size={16}
                                className="text-rose-600 flex-shrink-0"
                              />
                            ) : (
                              <AlertCircle
                                size={16}
                                className="text-rose-600 flex-shrink-0"
                              />
                            )}
                            <span className="font-mono font-semibold text-slate-900">
                              {pay.payment_number}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-900 font-medium">
                            {displayName}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-indigo-600">
                          <Link href="/invoices" className="hover:underline">
                            {invoice?.invoice_number || "INV-2026-N/A"}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatINR(pay.amount)}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
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
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
