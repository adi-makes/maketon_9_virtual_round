"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Rocket,
  AlertTriangle,
  ArrowUp,
  Search,
  ChevronDown,
  SlidersHorizontal,
  MoreVertical,
  ChevronRight,
  MapPin,
  X,
  AlertCircle,
  Cpu,
  BellRing,
  Receipt,
  Clock,
  ShieldCheck,
  Download,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { CustomerDetailRecord } from "@/lib/customers/types";
import { computeCustomerDirectoryMetrics } from "@/lib/customers/service";
import { CreateCustomerDialog } from "./CreateCustomerDialog";
import { getCustomers } from "@/actions/customers";

interface CustomersClientViewProps {
  initialCustomers: CustomerDetailRecord[];
  initialError?: string | null;
}

const formatINR = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export function CustomersClientView({
  initialCustomers,
  initialError,
}: CustomersClientViewProps) {
  const [customers, setCustomers] = useState<CustomerDetailRecord[]>(initialCustomers);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomers[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<"month" | "quarter">("month");
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getCustomers();
      if (res.success && res.data) {
        setCustomers(res.data);
        setError(null);
        if (!selectedCustomerId && res.data.length > 0) {
          setSelectedCustomerId(res.data[0].id);
        }
      } else if (!res.success) {
        setError(res.error || "Failed to refresh customer records.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Metrics computation from live customer records
  const metrics = useMemo(() => {
    return computeCustomerDirectoryMetrics(customers);
  }, [customers]);

  // Filtered dataset
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const company = c.company_name || "";
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.legalEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.gstin.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || c.status === statusFilter;

      const matchesTier =
        tierFilter === "all" ||
        (tierFilter === "enterprise" && c.tierName.toLowerCase().includes("enterprise")) ||
        (tierFilter === "trial" && c.status === "trial") ||
        (tierFilter === "setup" && c.status === "onboarding");

      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [customers, searchQuery, statusFilter, tierFilter]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return (
      customers.find((c) => c.id === selectedCustomerId) ||
      customers[0] ||
      null
    );
  }, [customers, selectedCustomerId]);

  // Status Badge Component
  const renderStatusBadge = (status: CustomerDetailRecord["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-emerald-50 text-emerald-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case "at_risk":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-rose-50 text-rose-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            At Risk
          </span>
        );
      case "trial":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-blue-50 text-blue-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Trial
          </span>
        );
      case "onboarding":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-amber-50 text-amber-800 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Onboarding
          </span>
        );
    }
  };

  // Define Columns for the DataTable
  const columns: ColumnDef<CustomerDetailRecord>[] = [
    {
      header: "Customer & GSTIN",
      cell: (customer) => {
        const displayName = customer.company_name || customer.name;
        const isSelected = selectedCustomer?.id === customer.id;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 shadow-xs ${customer.colorClass}`}
            >
              {customer.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-headline-sm text-headline-sm leading-tight truncate text-sm ${
                    isSelected ? "font-bold text-primary" : "font-semibold text-on-surface"
                  }`}
                >
                  {displayName}
                </span>
                {customer.overdue > 0 && (
                  <span
                    className="w-2 h-2 rounded-full bg-error flex-shrink-0"
                    title="Action required: Overdue invoices"
                  />
                )}
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate text-xs">
                {customer.legalEntity}
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant/80 text-[10px]">
                GST: {customer.gstin}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Primary Contact",
      cell: (customer) => (
        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-on-surface font-medium text-xs">
            {customer.name}
          </span>
          <span className="text-on-surface-variant truncate text-[11px]">
            {customer.email}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant/70 text-[11px]">
            {customer.phone || "+91 98450 12890"}
          </span>
        </div>
      ),
    },
    {
      header: "Subscriptions",
      align: "center",
      cell: (customer) => {
        return (
          <div className="inline-flex flex-col items-center">
            <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface text-xs">
              {customer.activeSubscriptionsCount > 0
                ? `${customer.activeSubscriptionsCount} Active`
                : customer.totalSubscriptionsCount > 0
                ? `${customer.totalSubscriptionsCount} Enrolled`
                : "0 Live"}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-label-sm bg-purple-50 text-purple-700 font-medium">
              {customer.tierName.split(" ")[0]}
            </span>
          </div>
        );
      },
    },
    {
      header: "Lifetime Rev",
      align: "right",
      cell: (customer) => {
        return (
          <div className="flex flex-col items-end">
            <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold text-xs">
              {formatINR(customer.ltv)}
            </span>
            {customer.overdue > 0 ? (
              <div className="font-mono-data-sm text-[10px] text-error font-medium">
                {formatINR(customer.overdue)} overdue
              </div>
            ) : (
              <div className="font-mono-data-sm text-[10px] text-on-surface-variant">
                MRR {formatINR(customer.mrr)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      align: "center",
      cell: (customer) => renderStatusBadge(customer.status),
    },
    {
      header: "",
      align: "center",
      cell: (customer) => {
        const isSelected = selectedCustomer?.id === customer.id;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCustomerId(customer.id);
              setIsDrawerOpen(true);
            }}
            className={`p-1 rounded transition-colors ${
              isSelected
                ? "bg-primary-container text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            {isSelected ? <ChevronRight size={16} /> : <MoreVertical size={16} />}
          </button>
        );
      },
    },
  ];

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Company", "Email", "Phone", "Status", "MRR", "LTV", "Subscriptions", "Invoices"].join(","),
      ...customers.map((c) =>
        [
          `"${c.id}"`,
          `"${c.name}"`,
          `"${c.company_name || ""}"`,
          `"${c.email}"`,
          `"${c.phone || ""}"`,
          `"${c.status}"`,
          c.mrr,
          c.ltv,
          c.totalSubscriptionsCount,
          c.totalInvoicesCount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `subscriptiq_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full space-y-space-lg">
        {/* Error notification banner if database returned an error */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between text-rose-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-rose-600 flex-shrink-0" size={18} />
              <div>
                <span className="font-semibold">Database Error:</span> {error}
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page Header & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase bg-surface-container-high px-2 py-0.5 rounded text-[11px] font-semibold">
                CLIENT DIRECTORY &amp; ACCOUNT HEALTH
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-xs">
                • Supabase Live Records
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight text-2xl lg:text-3xl font-semibold">
              Customers
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm">
              Manage institutional client accounts, billing contacts, GST compliance, and lifetime revenue.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center flex-wrap gap-space-sm text-xs">
            <div className="flex items-center bg-surface-container-lowest shadow-sm rounded-lg p-1 text-on-surface-variant border border-surface-container-high/30">
              <button
                onClick={() => setTimeframe("month")}
                className={`px-2.5 py-1 text-label-md font-label-md rounded transition-all ${
                  timeframe === "month"
                    ? "text-on-surface bg-surface-container-low font-semibold shadow-xs"
                    : "hover:text-on-surface"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeframe("quarter")}
                className={`px-2.5 py-1 text-label-md font-label-md rounded transition-all ${
                  timeframe === "quarter"
                    ? "text-on-surface bg-surface-container-low font-semibold shadow-xs"
                    : "hover:text-on-surface"
                }`}
              >
                Q3 Cumulative
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all border border-surface-container-high/30 font-medium"
              title="Refresh from Supabase"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-all border border-surface-container-high/30 font-medium"
              type="button"
            >
              <Download size={16} />
              <span>Export Directory</span>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all font-semibold"
              type="button"
            >
              <PlusCircle size={16} />
              <span>+ Add Customer</span>
            </button>
          </div>
        </div>

        {/* Top KPI Telemetry Cards (4-column grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1: Total Customers */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Total Customers
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-low text-primary">
                <Building2 size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                {metrics.totalCustomers}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="inline-flex items-center text-label-sm font-label-sm px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[11px]">
                  <ArrowUp size={12} className="mr-0.5" />
                  Live Sync
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {metrics.activeCustomers} active
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{
                  width: `${metrics.totalCustomers > 0 ? (metrics.activeCustomers / metrics.totalCustomers) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Card 2: Active Accounts */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Active Accounts
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-low text-emerald-700">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                {metrics.activeCustomers}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="inline-flex items-center text-label-sm font-label-sm px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[11px]">
                  {metrics.totalCustomers > 0
                    ? `${Math.round((metrics.activeCustomers / metrics.totalCustomers) * 100)}% Health`
                    : "0% Health"}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Live billing contracts
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{
                  width: `${metrics.totalCustomers > 0 ? (metrics.activeCustomers / metrics.totalCustomers) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Card 3: New This Month */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                New This Month
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-low text-secondary">
                <Rocket size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                {metrics.newThisMonth}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
                  {formatINR(customers.reduce((sum, c) => sum + c.mrr, 0))}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  MRR base
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-secondary-container h-full w-[65%] rounded-full" />
            </div>
          </div>

          {/* Card 4: Outstanding AR Risk */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Outstanding AR Risk
              </span>
              <span className="p-1.5 rounded-lg bg-error-container/40 text-error">
                <AlertTriangle size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="font-mono-data-lg text-mono-data-lg text-error font-semibold tracking-tight text-2xl">
                {metrics.outstandingArRiskAccounts} Accounts
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="font-mono-data-sm text-mono-data-sm text-error font-semibold">
                  {formatINR(metrics.totalArRiskAmount)}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Dunning active
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-error h-full rounded-full transition-all"
                style={{
                  width: `${metrics.totalCustomers > 0 ? (metrics.outstandingArRiskAccounts / metrics.totalCustomers) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Search & Segment Filters Bar */}
        <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm border border-surface-container-high/30">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[280px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-xs"
              placeholder="Search by company, POC name, GSTIN, or email..."
              type="text"
            />
          </div>

          {/* Tabs & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Badges Filter */}
            <div className="flex items-center bg-surface-container-low rounded-lg p-1 text-on-surface-variant">
              {[
                { id: "all", label: "All", count: customers.length },
                {
                  id: "active",
                  label: "Active",
                  count: customers.filter((c) => c.status === "active").length,
                },
                {
                  id: "onboarding",
                  label: "Onboarding",
                  count: customers.filter((c) => c.status === "onboarding").length,
                },
                {
                  id: "at_risk",
                  label: "At Risk",
                  count: customers.filter((c) => c.status === "at_risk").length,
                  isError: true,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 text-label-sm font-label-sm rounded-md transition-all ${
                    statusFilter === tab.id
                      ? "bg-surface-container-lowest text-on-surface shadow-xs font-semibold"
                      : tab.isError
                      ? "text-error hover:text-error/80"
                      : "hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 font-mono-data-sm text-[11px] opacity-80">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Segment Selector */}
            <div className="relative inline-block text-left">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="flex items-center h-9 px-3 pr-8 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-all appearance-none cursor-pointer border border-surface-container-high/20 text-xs"
              >
                <option value="all">Tier: All Tiers</option>
                <option value="enterprise">Tier: Enterprise &amp; Mid</option>
                <option value="trial">Tier: Sandbox Pro</option>
                <option value="setup">Tier: Setup Stage</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-3 text-on-surface-variant"
              />
            </div>

            {/* GST Status Filter */}
            <button
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-all border border-surface-container-high/20"
              type="button"
            >
              <SlidersHorizontal size={14} className="text-on-surface-variant" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Main Split Layout: Table (8 cols) + Selected Customer Profile Inspector (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Left Column: High-Density Institutional Customers Table */}
          <div
            className={`${
              isDrawerOpen && selectedCustomer ? "lg:col-span-8" : "lg:col-span-12"
            } bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-container-high/30 transition-all`}
          >
            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant">
                <Building2 size={36} className="mx-auto text-on-surface-variant/40 mb-3" />
                <h3 className="font-headline-sm text-sm font-semibold text-on-surface">
                  No customers found
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {searchQuery || statusFilter !== "all" || tierFilter !== "all"
                    ? "Try adjusting your search criteria or clearing filters."
                    : "No customers have been registered yet."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                >
                  <PlusCircle size={14} />
                  <span>Add First Customer</span>
                </button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredCustomers}
                keyExtractor={(c) => c.id}
                selectable={true}
                selectedIds={selectedCustomer ? [selectedCustomer.id] : []}
                onRowClick={(c) => {
                  setSelectedCustomerId(c.id);
                  setIsDrawerOpen(true);
                }}
                pageSize={10}
              />
            )}
          </div>

          {/* Right Column: Selected Customer Profile Inspector Drawer */}
          {isDrawerOpen && selectedCustomer && (
            <div className="lg:col-span-4 space-y-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md border border-surface-container-high/30">
                {/* Inspector Card Header with Logo & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-sm ${selectedCustomer.colorClass}`}
                    >
                      {selectedCustomer.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold text-base">
                          {selectedCustomer.company_name || selectedCustomer.name}
                        </h3>
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5 text-xs">
                        <MapPin size={13} className="text-on-surface-variant flex-shrink-0" />
                        <span>
                          {selectedCustomer.billing_address.line1
                            ? `${selectedCustomer.billing_address.line1}, ${selectedCustomer.billing_address.city || "Bengaluru"}, ${selectedCustomer.billing_address.state || "KA"}`
                            : "JP Nagar 4th Phase, Bengaluru, KA"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                    title="Close Inspector"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Risk Callout Alert Banner (if overdue) */}
                {selectedCustomer.overdue > 0 && (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-900 flex items-start gap-2.5 border border-red-200">
                    <AlertCircle size={20} className="text-error flex-shrink-0 mt-0.5" />
                    <div className="text-[12px] leading-snug">
                      <div className="font-semibold text-error">
                        At Risk (Outstanding Balance)
                      </div>
                      <p className="text-error/80 mt-0.5">
                        Invoice #{selectedCustomer.overdueInvoiceRef || "INV-OVERDUE"} is{" "}
                        {selectedCustomer.overdueDays || 18} days overdue.
                      </p>
                    </div>
                  </div>
                )}

                {/* Compliance & Regulatory Grid */}
                <div className="bg-surface-container-low rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[11px]">
                      GSTIN (Active)
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold select-all">
                      {selectedCustomer.gstin}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[11px]">
                      Corporate PAN
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold select-all">
                      {selectedCustomer.pan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[11px]">
                      Tax Residency
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {selectedCustomer.residency}
                    </span>
                  </div>
                </div>

                {/* Financial Health Matrix (3 KPI Chips) */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-container-low rounded-lg p-2.5 text-center">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px] font-medium">
                      Total LTV
                    </div>
                    <div className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold mt-1 text-xs">
                      {formatINR(selectedCustomer.ltv)}
                    </div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-2.5 text-center">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px] font-medium">
                      Active MRR
                    </div>
                    <div className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold mt-1 text-xs">
                      {formatINR(selectedCustomer.mrr)}
                    </div>
                  </div>
                  <div
                    className={`${
                      selectedCustomer.overdue > 0 ? "bg-red-50" : "bg-surface-container-low"
                    } rounded-lg p-2.5 text-center`}
                  >
                    <div
                      className={`font-label-sm text-label-sm uppercase text-[10px] font-medium ${
                        selectedCustomer.overdue > 0 ? "text-error" : "text-on-surface-variant"
                      }`}
                    >
                      Overdue
                    </div>
                    <div
                      className={`font-mono-data-sm text-mono-data-sm font-semibold mt-1 text-xs ${
                        selectedCustomer.overdue > 0 ? "text-error" : "text-on-surface"
                      }`}
                    >
                      {formatINR(selectedCustomer.overdue)}
                    </div>
                  </div>
                </div>

                {/* Primary Billing Contact Details */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                      Primary FinOps POC
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container-low">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {selectedCustomer.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-label-md text-label-md text-on-surface font-medium text-xs">
                        {selectedCustomer.name}
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
                        {selectedCustomer.pocRole}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                        <span className="font-mono-data-sm text-mono-data-sm truncate">
                          {selectedCustomer.email}
                        </span>
                        <span>•</span>
                        <span className="font-mono-data-sm text-mono-data-sm">
                          {selectedCustomer.phone || "+91 98450 12890"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscribed Tier Plan & SLA */}
                <div className="space-y-2 text-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                    Current Plan &amp; SLA
                  </span>
                  <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Cpu size={20} className="text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-label-md text-label-md text-on-surface font-medium truncate text-xs">
                          {selectedCustomer.tierName}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
                          {selectedCustomer.activeSubscriptionsCount} Active Subscriptions • {selectedCustomer.tierSla}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-label-sm text-label-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[10px]">
                        {selectedCustomer.renewal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Institutional Action Buttons */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-error text-on-error font-label-md text-label-md hover:bg-error/90 transition-all shadow-xs font-semibold"
                      type="button"
                    >
                      <BellRing size={15} />
                      <span>Send Notice</span>
                    </button>
                    <Link
                      href="/invoices"
                      className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-all font-medium border border-surface-container-high/30"
                    >
                      <Receipt size={15} />
                      <span>View Invoices ({selectedCustomer.totalInvoicesCount})</span>
                    </Link>
                  </div>
                  <Link
                    href={`/subscriptions/new`}
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all font-semibold border border-primary/20"
                  >
                    <PlusCircle size={15} />
                    <span>Create Subscription</span>
                  </Link>
                </div>

                {/* Subscriptions List */}
                {selectedCustomer.subscriptions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-surface-container-high/40 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                        Customer Subscriptions ({selectedCustomer.subscriptions.length})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedCustomer.subscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between"
                        >
                          <div>
                            <div className="font-label-md text-on-surface font-medium text-xs">
                              {sub.plan_name}
                            </div>
                            <div className="text-[10px] text-on-surface-variant capitalize">
                              Cycle: {sub.billing_frequency} • {sub.status}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono-data-sm text-on-surface font-semibold text-xs">
                              {formatINR(sub.amount)}
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-emerald-50 text-emerald-700">
                              {sub.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Invoices Mini Telemetry List */}
                <div className="space-y-2 pt-2 border-t border-surface-container-high/40 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                      Ledger Invoices ({selectedCustomer.totalInvoicesCount})
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
                      {selectedCustomer.invoices.length > 0 ? `Showing ${Math.min(3, selectedCustomer.invoices.length)}` : "None"}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedCustomer.invoices.length === 0 ? (
                      <div className="p-3 text-center text-on-surface-variant bg-surface-container-low rounded-lg text-xs">
                        No invoices billed yet.
                      </div>
                    ) : (
                      selectedCustomer.invoices.slice(0, 3).map((inv) => {
                        const isOverdue =
                          inv.outstanding_balance > 0 &&
                          inv.status !== "paid" &&
                          inv.due_date &&
                          new Date(inv.due_date) < new Date();
                        return (
                          <div
                            key={inv.id}
                            className={`p-2 rounded-lg flex items-center justify-between ${
                              isOverdue ? "bg-red-50/60" : "bg-surface-container-low"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isOverdue ? (
                                <Clock size={16} className="text-error flex-shrink-0" />
                              ) : (
                                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                              )}
                              <div>
                                <div className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium text-xs">
                                  {inv.invoice_number}
                                </div>
                                <div className="font-body-sm text-body-sm text-on-surface-variant text-[10px]">
                                  {inv.due_date
                                    ? `Due: ${new Date(inv.due_date).toLocaleDateString()}`
                                    : "Due on receipt"}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`font-mono-data-sm text-mono-data-sm font-semibold text-xs ${
                                  isOverdue ? "text-error" : "text-on-surface"
                                }`}
                              >
                                {formatINR(inv.total_amount)}
                              </div>
                              <span
                                className={`font-label-sm text-label-sm uppercase text-[10px] font-semibold ${
                                  isOverdue
                                    ? "text-error"
                                    : inv.status === "paid"
                                    ? "text-emerald-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {isOverdue ? "Overdue" : inv.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Indian GST Audit Verification Banner */}
              <div className="p-3 rounded-xl bg-surface-container-high/50 shadow-sm flex items-center justify-between border border-surface-container-high/30">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className="text-primary flex-shrink-0" />
                  <div>
                    <div className="font-label-md text-label-md text-on-surface font-medium text-xs">
                      GST e-Invoicing Compliance
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      Live sync connected to Supabase PostgreSQL schema.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm shadow-xs hover:bg-surface-container transition-all font-semibold text-xs border border-surface-container-high/30"
                >
                  Verify
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <CreateCustomerDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleRefresh}
      />
    </main>
  );
}
