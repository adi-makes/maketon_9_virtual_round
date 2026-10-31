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
} from "../mockData";

export function DashboardPage() {
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetricView, setSelectedMetricView] = useState<"revenue" | "mrr" | "collected">("revenue");
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

  const latestMRR = mockRevenueStats[mockRevenueStats.length - 1]?.mrr ?? 1655.5;

  const activeSubscriptionsCount = mockSubscriptions.filter(
    (s) => s.status === "active"
  ).length;

  const totalCustomersCount = mockCustomers.length;

  const outstandingBalance = mockInvoices.reduce(
    (sum, inv) => sum + inv.outstanding_balance,
    0
  );

  const overdueInvoicesCount = mockInvoices.filter(
    (inv) => inv.outstanding_balance > 0 && inv.status !== "paid" && inv.status !== "cancelled"
  ).length;

  // Plan Distribution breakdown
  const totalSubsCount = mockSubscriptions.length || 1;
  const activeSubs = mockSubscriptions.filter((s) => s.status === "active").length;
  const confirmedSubs = mockSubscriptions.filter((s) => s.status === "confirmed").length;
  const pausedSubs = mockSubscriptions.filter((s) => s.status === "paused").length;
  const otherSubs = mockSubscriptions.filter((s) => s.status === "draft" || s.status === "closed").length;

  const activePercent = Math.round((activeSubs / totalSubsCount) * 100);
  const confirmedPercent = Math.round((confirmedSubs / totalSubsCount) * 100);
  const pausedPercent = Math.round((pausedSubs / totalSubsCount) * 100);
  const otherPercent = Math.max(0, 100 - activePercent - confirmedPercent - pausedPercent);

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
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full space-y-space-lg">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="space-y-1">
            <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-on-surface-variant uppercase tracking-wider text-xs">
              <span>Portfolio Analytics</span>
              <span>/</span>
              <span className="text-primary font-medium">Real-time Stream</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold text-2xl lg:text-3xl">
              Dashboard
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Monitor your subscription business and financial performance across active cohorts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            {/* Date Range Selector */}
            <div className="flex items-center bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm border border-surface-container-high/30">
              <Calendar size={18} className="text-on-surface-variant mr-2" />
              <span className="font-label-md text-label-md text-on-surface font-medium text-xs">
                Oct 1 - Oct 31, 2024
              </span>
              <span className="mx-2 text-outline-variant font-mono-data-sm text-xs">|</span>
              <span className="font-mono-data-sm text-mono-data-sm text-primary font-semibold text-xs">
                Last 30 Days
              </span>
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
                  isRefreshing ? "rotate-180 text-primary" : ""
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
                    href="/customers/new"
                    className="flex items-center gap-2 px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container text-xs"
                  >
                    <UserPlus size={16} className="text-primary" />
                    <span>Add Customer</span>
                  </Link>
                  <Link
                    href="/invoices/new"
                    className="flex items-center gap-2 px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container text-xs"
                  >
                    <Receipt size={16} className="text-primary" />
                    <span>Create Invoice</span>
                  </Link>
                  <Link
                    href="/reports"
                    className="flex items-center gap-2 px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container text-xs"
                  >
                    <BarChart3 size={16} className="text-primary" />
                    <span>Export Summary</span>
                  </Link>
                </div>
              )}
            </div>

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

        {/* Action Shortcut Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
          <Link
            href="/customers/new"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm transition-all text-left border border-surface-container-high/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <UserPlus size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface text-sm">
                  Add Customer
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Onboard new account
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
                  Create Subscription
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Provision billing cycle
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="text-on-surface-variant group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/invoices/new"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm transition-all text-left border border-surface-container-high/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Receipt size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface text-sm">
                  Create Invoice
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Ad-hoc or pro-rated
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="text-on-surface-variant group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/reports"
            className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm transition-all text-left border border-surface-container-high/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Activity size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface text-sm">
                  View Reports
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Tax, MRR &amp; churn logic
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="text-on-surface-variant group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 6 Key Financial Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-sm">
          {/* Card 1: Total Revenue */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                Total Revenue
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
                  +14.2%
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">vs last month</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Gross settled ({mockPayments.length} transactions)
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
                  +8.6%
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">vs last month</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Run-rate: {formatINR(latestMRR * 12)}
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
                  +{mockSubscriptions.length} total
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">in cohort</span>
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
                  +100% net
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">retention</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Across 5 global territories
            </div>
          </div>

          {/* Card 5: Outstanding Balance */}
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
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  <ArrowDown size={12} className="mr-0.5" />
                  -4.3%
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">vs last month</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Pending in {overdueInvoicesCount} invoices
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
                  Active balance
                </span>
                <span className="font-body-sm text-body-sm text-error text-xs">&gt;0 due</span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Actionable balance items
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          {/* Revenue Trajectory & Expansion (8 cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-surface-container-high/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface text-lg">
                    Revenue Trajectory &amp; Expansion
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-data-sm bg-surface-container-high text-primary font-semibold">
                    AUDITED
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Cumulative recurring billings against targeted annual run rate
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg bg-surface-container-low p-1">
                  <button
                    onClick={() => setSelectedMetricView("revenue")}
                    className={`px-2.5 py-1 rounded-md text-label-sm font-label-md text-xs font-medium transition-all ${
                      selectedMetricView === "revenue"
                        ? "bg-surface-container-lowest text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    onClick={() => setSelectedMetricView("mrr")}
                    className={`px-2.5 py-1 rounded-md text-label-sm font-label-md text-xs font-medium transition-all ${
                      selectedMetricView === "mrr"
                        ? "bg-surface-container-lowest text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    MRR (₹)
                  </button>
                  <button
                    onClick={() => setSelectedMetricView("collected")}
                    className={`px-2.5 py-1 rounded-md text-label-sm font-label-md text-xs font-medium transition-all ${
                      selectedMetricView === "collected"
                        ? "bg-surface-container-lowest text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Collected
                  </button>
                </div>
                <div className="flex rounded-lg bg-surface-container-low p-1">
                  <button
                    onClick={() => setTimeframe("monthly")}
                    className={`px-2 py-1 rounded-md text-label-sm font-label-md text-xs font-medium transition-all ${
                      timeframe === "monthly"
                        ? "bg-surface-container-lowest text-on-surface shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setTimeframe("quarterly")}
                    className={`px-2 py-1 rounded-md text-label-sm font-label-md text-xs font-medium transition-all ${
                      timeframe === "quarterly"
                        ? "bg-surface-container-lowest text-on-surface shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
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
                    <stop offset="0%" stopColor="#006693" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#006693" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines & axis markers */}
                <line stroke="#eaedff" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="740" y1="20" y2="20" />
                <text className="fill-outline font-mono-data-sm text-[11px]" textAnchor="end" x="32" y="24">
                  14L
                </text>
                <line stroke="#eaedff" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="740" y1="75" y2="75" />
                <text className="fill-outline font-mono-data-sm text-[11px]" textAnchor="end" x="32" y="79">
                  10.5L
                </text>
                <line stroke="#eaedff" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="740" y1="130" y2="130" />
                <text className="fill-outline font-mono-data-sm text-[11px]" textAnchor="end" x="32" y="134">
                  7.0L
                </text>
                <line stroke="#eaedff" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="740" y1="185" y2="185" />
                <text className="fill-outline font-mono-data-sm text-[11px]" textAnchor="end" x="32" y="189">
                  3.5L
                </text>
                <line stroke="#dae2fd" strokeWidth="1" x1="40" x2="740" y1="230" y2="230" />
                <text className="fill-outline font-mono-data-sm text-[11px]" textAnchor="end" x="32" y="234">
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
                  stroke="#006693"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                <path
                  d="M 50 195 L 125 185 L 200 165 L 275 150 L 350 140 L 425 115 L 500 90 L 575 80 L 650 60 L 725 35"
                  fill="none"
                  stroke="#3525cd"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />

                {/* Point Circles */}
                <circle cx="50" cy="195" fill="#ffffff" r="3.5" stroke="#3525cd" strokeWidth="2" />
                <circle cx="125" cy="185" fill="#ffffff" r="3.5" stroke="#3525cd" strokeWidth="2" />
                <circle cx="200" cy="165" fill="#ffffff" r="3.5" stroke="#3525cd" strokeWidth="2" />
                <circle cx="275" cy="150" fill="#ffffff" r="3.5" stroke="#3525cd" strokeWidth="2" />
                <circle cx="350" cy="140" fill="#ffffff" r="3.5" stroke="#3525cd" strokeWidth="2" />
                <circle cx="425" cy="115" fill="#ffffff" r="3.5" stroke="#3525cd" strokeWidth="2" />
                <circle cx="500" cy="90" fill="#ffffff" r="3.5" stroke="#3525cd" strokeWidth="2" />
                <circle cx="575" cy="80" fill="#ffffff" r="3.5" stroke="#3525cd" strokeWidth="2" />
                <circle cx="650" cy="60" fill="#ffffff" r="3.5" stroke="#3525cd" strokeWidth="2" />
                <circle cx="725" cy="35" fill="#4f46e5" r="5" stroke="#ffffff" strokeWidth="2" />

                {/* Month labels */}
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, idx) => (
                  <text
                    key={m}
                    className={`font-mono-data-sm text-[11px] ${
                      idx === 9 ? "fill-primary font-bold" : "fill-outline"
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
              <div className="absolute right-4 top-2 bg-inverse-surface text-inverse-on-surface p-2.5 rounded-lg shadow-xl pointer-events-none transform -translate-y-2">
                <div className="flex items-center justify-between gap-3 text-xs mb-1">
                  <span className="font-mono-data-sm text-secondary-fixed-dim">Oct Peak Settled</span>
                  <span className="font-mono-data-sm font-bold text-white">{formatINR(totalRevenue)}</span>
                </div>
                <div className="flex flex-col text-[11px] text-surface-container-highest space-y-0.5">
                  <div className="flex justify-between gap-2">
                    <span>Active MRR:</span>
                    <span className="text-white font-mono-data-sm">{formatINR(latestMRR)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Active Subscriptions:</span>
                    <span className="text-white font-mono-data-sm">{activeSubscriptionsCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Legend & Accuracy */}
            <div className="flex flex-wrap items-center justify-between pt-space-sm gap-space-sm font-label-sm text-label-sm text-xs">
              <div className="flex flex-wrap items-center gap-space-md">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-on-surface">Net Recurring Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary-container" />
                  <span className="text-on-surface-variant">Expansion Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-surface-container-high" />
                  <span className="text-on-surface-variant">One-time Setup Fees</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                <span>Target Accuracy:</span>
                <span className="text-primary font-semibold">99.98%</span>
              </div>
            </div>
          </div>

          {/* Plan Distribution (4 cols) */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-surface-container-high/20">
            <div className="flex items-center justify-between pb-space-sm">
              <div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface text-lg">
                  Plan Distribution
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  {totalSubsCount} active accounts by life-cycle
                </p>
              </div>
              <button
                className="p-1 text-on-surface-variant hover:text-on-surface rounded"
                type="button"
                aria-label="Options"
              >
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Circular Donut Diagram */}
            <div className="flex items-center justify-center my-2 relative">
              <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 160 160">
                <circle cx="80" cy="80" fill="transparent" r="62" stroke="#eaedff" strokeWidth="16" />
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
                <span className="font-mono-data-lg text-mono-data-lg font-bold text-on-surface tracking-tight text-2xl">
                  {totalSubsCount}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[10px]">
                  Total Subscriptions
                </span>
              </div>
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
                  Real-time cohort creations and recurring contracts
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
                  {mockSubscriptions.slice(0, 5).map((sub) => {
                    const customer = mockCustomers.find((c) => c.id === sub.customer_id);
                    const plan = mockPlans.find((p) => p.id === sub.plan_id);
                    const items = mockSubscriptionItems.filter((i) => i.subscription_id === sub.id);
                    const amount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

                    const displayName = customer?.company_name || customer?.name || "Customer";
                    const email = customer?.email || "billing@client.com";
                    const initials = getInitials(displayName);

                    return (
                      <tr key={sub.id} className="hover:bg-surface-container-low transition-colors border-b border-surface-container-high/10">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center font-mono-data-sm text-[11px] font-bold text-primary">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                                {displayName}
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-[11px]">
                                {email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-label-md text-label-md text-on-surface font-medium">
                            {plan?.name || "Standard Plan"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {formatDate(sub.start_date)}
                        </td>
                        <td className="py-3 px-3 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                          {formatDate(sub.next_billing_date)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
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
                    );
                  })}
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
                  Gateways, mandates &amp; instant reconciliations
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
                    <th className="py-2.5 px-4 font-semibold">Txn Reference</th>
                    <th className="py-2.5 px-3 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Invoice</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-3 font-semibold">Settled Date</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm divide-y-0 text-xs">
                  {mockPayments.slice(0, 5).map((pay) => {
                    const customer = mockCustomers.find((c) => c.id === pay.customer_id);
                    const invoice = mockInvoices.find((i) => i.id === pay.invoice_id);
                    const displayName = customer?.company_name || customer?.name || "Customer";

                    return (
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
                            {displayName}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono-data-sm text-mono-data-sm text-primary">
                          <Link href={`/invoices`} className="hover:underline">
                            {invoice?.invoice_number || "INV-2024-N/A"}
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
                    );
                  })}
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

