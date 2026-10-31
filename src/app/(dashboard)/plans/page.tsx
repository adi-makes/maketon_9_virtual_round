"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  CheckCircle2,
  TrendingUp,
  ArrowUp,
  ShieldCheck,
  Download,
  Plus,
  PlusCircle,
  PieChart,
  Building2,
  Rocket,
  SlidersHorizontal,
  Calendar,
  CalendarRange,
  RefreshCw,
  Copy,
  Archive,
  MoreVertical,
  ChevronRight,
  Search,
  Award,
} from "lucide-react";
import { mockPlans, mockProducts, type CatalogPlan } from "@/mockData";
import { DataTable, type ColumnDef } from "@/components/DataTable";

const formatINR = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export default function PlansPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan-004");
  const [cadenceTab, setCadenceTab] = useState<"monthly" | "annual" | "multi">("annual");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Product helper
  const getProductName = (productId: string) => {
    const prod = mockProducts.find((p) => p.id === productId);
    return prod ? prod.name : "SubscriptIQ Core Platform";
  };

  // Selected Plan
  const selectedPlan = useMemo(() => {
    return (
      mockPlans.find((p) => p.id === selectedPlanId) ||
      mockPlans.find((p) => p.id === "plan-004") ||
      mockPlans[0]
    );
  }, [selectedPlanId]);

  // Filtered dataset for DataTable
  const filteredPlans = useMemo(() => {
    return mockPlans.filter((p) => {
      const productName = getProductName(p.product_id);
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mandate_quota.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFrequency =
        frequencyFilter === "all" || p.billing_frequency === frequencyFilter;

      const matchesProduct =
        productFilter === "all" || p.product_id === productFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "draft" && !p.is_active);

      return matchesSearch && matchesFrequency && matchesProduct && matchesStatus;
    });
  }, [searchQuery, frequencyFilter, productFilter, statusFilter]);

  // Columns for DataTable
  const columns: ColumnDef<CatalogPlan>[] = [
    {
      header: "Plan Name & Code",
      cell: (p) => {
        const isSelected = selectedPlan?.id === p.id;
        return (
          <div className="flex items-start gap-2.5 py-1">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0 text-primary">
              <Layers size={16} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-headline-sm text-headline-sm leading-tight text-sm ${
                    isSelected ? "font-bold text-primary" : "font-semibold text-on-surface"
                  }`}
                >
                  {p.name}
                </span>
                {p.is_popular && (
                  <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded-full bg-primary-container text-on-primary font-semibold text-[10px]">
                    Most Popular
                  </span>
                )}
                {isSelected && (
                  <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded bg-primary-fixed text-primary font-semibold text-[10px]">
                    SELECTED
                  </span>
                )}
              </div>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px] block">
                Code: {p.code}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Associated Product",
      cell: (p) => (
        <span className="font-medium text-on-surface text-xs truncate max-w-[170px] block">
          {getProductName(p.product_id)}
        </span>
      ),
    },
    {
      header: "Cadence",
      align: "center",
      cell: (p) => (
        <span className="font-mono-data-sm text-mono-data-sm px-2 py-0.5 rounded bg-surface-container text-on-surface capitalize text-xs">
          {p.billing_frequency}
        </span>
      ),
    },
    {
      header: "Price",
      align: "right",
      cell: (p) => (
        <div className="flex flex-col items-end">
          <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold text-xs">
            {formatINR(p.price)}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant text-[10px]">
            {p.billing_frequency === "monthly" ? "/mo" : "/yr"}
          </span>
        </div>
      ),
    },
    {
      header: "Mandates & SLA",
      cell: (p) => (
        <div className="flex flex-col text-xs">
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
            {p.mandate_quota}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant text-[10px]">
            {p.support_sla}
          </span>
        </div>
      ),
    },
    {
      header: "Accounts",
      align: "center",
      cell: (p) => (
        <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold text-xs">
          {p.active_accounts} live
        </span>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (p) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm text-xs font-medium ${
            p.is_active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              p.is_active ? "bg-emerald-500" : "bg-outline"
            }`}
          />
          {p.is_active ? "Active" : "Draft"}
        </span>
      ),
    },
    {
      header: "",
      align: "center",
      cell: (p) => {
        const isSelected = selectedPlan?.id === p.id;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPlanId(p.id);
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

  return (
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full gap-space-lg">
        {/* Header & Action Bar */}
        <div className="flex flex-col gap-space-sm md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-xs">
                SubscriptIQ
              </span>
              <span className="font-label-sm text-label-sm text-outline-variant">/</span>
              <span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider text-xs">
                Plans
              </span>
              <span className="ml-space-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-primary-fixed-variant font-label-sm text-label-sm uppercase font-semibold text-[10px]">
                Pricing Tiers &amp; Billing Cadence
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight text-2xl lg:text-3xl font-semibold">
              Plans
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm">
              Configure subscription pricing tiers, billing frequencies (Weekly, Monthly, Yearly), trial periods, and minimum quantities with surgical precision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm text-xs">
            <div className="flex items-center p-1 rounded-xl bg-surface-container shadow-sm border border-surface-container-high/30">
              <button
                onClick={() => setCadenceTab("monthly")}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 ${
                  cadenceTab === "monthly"
                    ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                Monthly
              </button>
              <button
                onClick={() => setCadenceTab("annual")}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 flex items-center gap-1.5 ${
                  cadenceTab === "annual"
                    ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                <span>Annual</span>
                <span className="px-1.5 py-0.2 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm text-[10px] font-semibold">
                  Save 15%
                </span>
              </button>
              <button
                onClick={() => setCadenceTab("multi")}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 ${
                  cadenceTab === "multi"
                    ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                Multi-Year
              </button>
            </div>

            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-all border border-surface-container-high/30 font-medium"
              type="button"
            >
              <Download size={15} />
              <span>Export Matrix</span>
            </button>

            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm transition-all font-semibold"
              type="button"
            >
              <Plus size={16} />
              <span>Create Plan</span>
            </button>
          </div>
        </div>

        {/* KPI Ribbon: 4 Dense Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {/* Card 1: Active Plans */}
          <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm relative overflow-hidden border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Active Plans
              </span>
              <div className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                <Layers size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                  {mockPlans.filter((p) => p.is_active).length}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant text-xs">
                  Tiers Live
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 text-xs">
                {mockPlans.filter((p) => !p.is_active).length} archived • 2 in staging draft
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-space-xs text-on-surface-variant font-label-sm text-label-sm text-xs border-t border-surface-container-high/20">
              <CheckCircle2 size={14} className="text-secondary" />
              <span>All catalogs sync&apos;d to Razorpay/Stripe</span>
            </div>
          </div>

          {/* Card 2: Most Popular */}
          <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm relative overflow-hidden border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Most Popular
              </span>
              <div className="p-1.5 rounded-lg bg-surface-container-high text-secondary">
                <Award size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold text-lg">
                  Pro Scale Annual
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 text-xs">
                118 accounts active
              </p>
            </div>
            <div className="flex items-center justify-between pt-space-xs font-label-sm text-label-sm text-xs border-t border-surface-container-high/20">
              <span className="text-on-surface-variant">Catalog Revenue Share</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high font-mono-data-sm text-mono-data-sm text-primary font-semibold text-[11px]">
                35.5% share
              </span>
            </div>
          </div>

          {/* Card 3: Average Plan Value */}
          <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm relative overflow-hidden border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Average Plan Value
              </span>
              <div className="p-1.5 rounded-lg bg-surface-container-high text-tertiary">
                <TrendingUp size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                  ₹41,500
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant text-xs">
                  /year
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 text-xs">
                Weighted ARPU across 248 accounts
              </p>
            </div>
            <div className="flex items-center gap-1 pt-space-xs text-primary font-label-sm text-label-sm text-xs border-t border-surface-container-high/20">
              <ArrowUp size={13} />
              <span className="font-semibold">+12.4%</span>
              <span className="text-on-surface-variant font-normal">vs. previous quarter</span>
            </div>
          </div>

          {/* Card 4: Trial Conversion */}
          <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm relative overflow-hidden border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Trial Conversion
              </span>
              <div className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                  78.4%
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant text-xs">
                  to paid
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 text-xs">
                Average conversion time: 11.2 days
              </p>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full w-[78.4%]" />
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md p-space-sm rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/30 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant px-2 font-semibold text-[11px]">
              Frequency:
            </span>
            {[
              { id: "all", label: "All Frequencies" },
              { id: "monthly", label: "Monthly" },
              { id: "yearly", label: "Yearly" },
            ].map((fq) => (
              <button
                key={fq.id}
                onClick={() => setFrequencyFilter(fq.id)}
                className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-colors ${
                  frequencyFilter === fq.id
                    ? "bg-surface-container-high text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
                type="button"
              >
                {fq.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-2.5 top-2 text-on-surface-variant pointer-events-none"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plans or quotas..."
                className="w-48 h-8 pl-8 pr-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/20"
                type="text"
              />
            </div>

            {/* Product Selector */}
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface border border-surface-container-high/30 text-xs cursor-pointer"
            >
              <option value="all">Product: All Products</option>
              {mockProducts.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>

            {/* Status Toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-container-low border border-surface-container-high/20">
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-all ${
                  statusFilter === "active"
                    ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                Active ({mockPlans.filter((p) => p.is_active).length})
              </button>
              <button
                onClick={() => setStatusFilter("draft")}
                className={`px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-all ${
                  statusFilter === "draft"
                    ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                Drafts ({mockPlans.filter((p) => !p.is_active).length})
              </button>
            </div>
          </div>
        </div>

        {/* Split Grid: Primary Pricing Tiers (8 cols) + Selected Plan Inspector (4 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* LEFT: Primary Pricing Cards & Breakdown (8 cols) */}
          <div className="xl:col-span-8 flex flex-col gap-space-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                  Primary Pricing Tiers
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm text-xs">
                  INR Currency Normalized
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                Showing production tiers
              </span>
            </div>

            {/* 3 Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md items-stretch">
              {/* Card 1: Starter Cloud */}
              <div
                onClick={() => setSelectedPlanId("plan-001")}
                className={`p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-md transition-all duration-200 cursor-pointer border ${
                  selectedPlan?.id === "plan-001"
                    ? "ring-2 ring-primary border-primary shadow-md"
                    : "border-surface-container-high/30 hover:shadow-md"
                }`}
              >
                <div className="flex flex-col gap-space-sm text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm uppercase text-on-surface-variant font-semibold text-[10px]">
                      Tier 01
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      42 Active
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold text-base">
                      Starter Cloud
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs">
                      Designed for early-stage fintechs and proof-of-concept setups.
                    </p>
                  </div>
                  <div className="pt-space-xs">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold text-xl">
                        ₹8,500
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant text-xs">
                        / month
                      </span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
                      ₹85,000 / year billed annually
                    </span>
                  </div>
                  <div className="h-px bg-surface-container-high my-space-xs" />
                  <div className="flex flex-col gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[10px]">
                      Included Features:
                    </span>
                    {[
                      "Up to 500 active mandates",
                      "Standard GST invoice engine",
                      "Email support (24h response)",
                      "1 webhook endpoint",
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-on-surface text-xs">
                        <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanId("plan-001");
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors font-medium text-xs mt-3"
                  type="button"
                >
                  Configure Tier
                </button>
              </div>

              {/* Card 2: Pro Scale (Highlighted) */}
              <div
                onClick={() => setSelectedPlanId("plan-004")}
                className={`p-space-lg rounded-xl bg-surface-container-lowest shadow-md flex flex-col justify-between gap-space-md transition-all duration-200 relative cursor-pointer border ${
                  selectedPlan?.id === "plan-004"
                    ? "ring-2 ring-primary border-primary"
                    : "border-primary/40 hover:shadow-lg"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm uppercase font-semibold text-[10px]">
                    Most Popular
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm text-primary font-semibold text-xs">
                    118 Active
                  </span>
                </div>
                <div className="flex flex-col gap-space-sm text-xs">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold text-base">
                      Pro Scale
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs">
                      For high-growth platforms managing high recurring transaction volumes.
                    </p>
                  </div>
                  <div className="pt-space-xs">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold text-xl">
                        ₹32,000
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant text-xs">
                        / month
                      </span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-secondary font-medium text-[11px]">
                      ₹3,20,000 / year (Save 16%)
                    </span>
                  </div>
                  <div className="h-px bg-surface-container-high my-space-xs" />
                  <div className="flex flex-col gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[10px]">
                      Scale Capabilities:
                    </span>
                    {[
                      "Up to 5,000 active mandates",
                      "Automated e-NACH & UPI AutoPay",
                      "Smart dunning retries & escalation",
                      "5 team seats included",
                      "Priority Slack connect channel",
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-on-surface text-xs">
                        <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanId("plan-004");
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm transition-colors font-semibold text-xs mt-3"
                  type="button"
                >
                  Manage Rules &amp; Tranches
                </button>
              </div>

              {/* Card 3: Enterprise Custom */}
              <div
                onClick={() => setSelectedPlanId("plan-006")}
                className={`p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-md transition-all duration-200 cursor-pointer border ${
                  selectedPlan?.id === "plan-006"
                    ? "ring-2 ring-primary border-primary shadow-md"
                    : "border-surface-container-high/30 hover:shadow-md"
                }`}
              >
                <div className="flex flex-col gap-space-sm text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm uppercase text-on-surface-variant font-semibold text-[10px]">
                      Tier 03
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      88 Active
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold text-base">
                      Enterprise Custom
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs">
                      Full-scale institutional billing governance &amp; dedicated telemetry.
                    </p>
                  </div>
                  <div className="pt-space-xs">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold text-xl">
                        ₹1,20,000
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant text-xs">
                        / yr base
                      </span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
                      + volume metered overages
                    </span>
                  </div>
                  <div className="h-px bg-surface-container-high my-space-xs" />
                  <div className="flex flex-col gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[10px]">
                      Enterprise Core:
                    </span>
                    {[
                      "Unlimited mandates & webhooks",
                      "Dedicated Technical Account Manager",
                      "99.99% billing engine uptime SLA",
                      "Custom SAC billing rules & VPC deploy",
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-on-surface text-xs">
                        <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanId("plan-006");
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors font-medium text-xs mt-3"
                  type="button"
                >
                  Contact Enterprise Ops
                </button>
              </div>
            </div>

            {/* Active Subscriptions Breakdown by Tier Banner */}
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md border border-surface-container-high/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm text-xs">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                    Active Subscriptions Breakdown by Tier
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Live portfolio distribution across active accounts (248 total)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    Pro Scale (47.6%)
                  </span>
                  <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                    Enterprise (35.5%)
                  </span>
                  <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim" />
                    Starter (16.9%)
                  </span>
                </div>
              </div>
              <div className="w-full flex h-3 rounded-full overflow-hidden bg-surface-container">
                <div className="bg-primary h-full w-[47.6%]" title="Pro Scale: 118 accounts" />
                <div className="bg-tertiary h-full w-[35.5%]" title="Enterprise: 88 accounts" />
                <div className="bg-secondary-fixed-dim h-full w-[16.9%]" title="Starter: 42 accounts" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md pt-space-xs text-xs">
                <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                      Pro Scale MRR
                    </span>
                    <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold text-sm">
                      ₹37,76,000
                    </span>
                  </div>
                  <PieChart size={20} className="text-primary" />
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                      Enterprise MRR
                    </span>
                    <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold text-sm">
                      ₹8,80,000 + Usage
                    </span>
                  </div>
                  <Building2 size={20} className="text-tertiary" />
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                      Starter MRR
                    </span>
                    <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold text-sm">
                      ₹3,57,000
                    </span>
                  </div>
                  <Rocket size={20} className="text-on-surface-variant" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Plan Configuration & Rules Inspector Drawer (4 cols) */}
          <div className="xl:col-span-4 flex flex-col gap-space-md">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md sticky top-20 border border-surface-container-high/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary" />
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                    Plan Configuration &amp; Rules
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono-data-sm text-mono-data-sm font-semibold text-xs">
                  {selectedPlan.code.toUpperCase().slice(0, 8)}
                </span>
              </div>

              {/* Selected Plan Banner */}
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1 text-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[10px]">
                  Inspecting Selected Plan
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                  {selectedPlan.name}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                  Code:{" "}
                  <code className="font-mono-data-sm text-mono-data-sm text-primary font-semibold">
                    {selectedPlan.code}
                  </code>
                </span>
              </div>

              {/* Billing Cycles Supported */}
              <div className="flex flex-col gap-2.5 text-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                  Billing Cycles Supported
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-primary" />
                      <span className="font-medium text-on-surface">Monthly</span>
                    </div>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">
                      {formatINR(selectedPlan.price)} / mo
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm">
                    <div className="flex items-center gap-2">
                      <CalendarRange size={15} className="text-primary" />
                      <span className="font-medium text-on-surface">Quarterly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm text-[10px]">
                        6% off
                      </span>
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">
                        {formatINR(Math.round(selectedPlan.price * 2.82))} / qtr
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-high font-body-sm text-body-sm border border-primary/20">
                    <div className="flex items-center gap-2">
                      <RefreshCw size={15} className="text-primary" />
                      <span className="font-medium text-primary font-semibold">Yearly (Primary)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold text-[10px]">
                        16% off
                      </span>
                      <span className="font-mono-data-sm text-mono-data-sm text-primary font-semibold">
                        {formatINR(selectedPlan.annual_price)} / yr
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-surface-container-high/40" />

              {/* Trial & Seat Provisioning */}
              <div className="flex flex-col gap-2.5 text-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                  Trial &amp; Seat Provisioning
                </span>
                <div className="grid grid-cols-2 gap-2 font-body-sm text-body-sm">
                  <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                      Trial Period
                    </span>
                    <span className="font-medium text-on-surface text-xs font-semibold">
                      {selectedPlan.trial_days > 0
                        ? `${selectedPlan.trial_days} Days Free`
                        : "No Free Trial"}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-[10px]">
                      No upfront credit card
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                      Seat Quota
                    </span>
                    <span className="font-medium text-on-surface text-xs font-semibold">
                      {selectedPlan.seat_quota} Seats
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-[10px]">
                      +₹1,500/seat add-on
                    </span>
                  </div>
                </div>
              </div>

              {/* Gateway Mandate Rules */}
              <div className="flex flex-col gap-2.5 text-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                  Gateway Mandate Rules
                </span>
                <div className="flex flex-col gap-1.5 font-body-sm text-body-sm">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                    <span className="text-on-surface text-xs">UPI AutoPay</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold text-[10px]">
                      Enabled (₹15,000 cap)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                    <span className="text-on-surface text-xs">e-Mandate (HDFC/ICICI)</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold text-[10px]">
                      Auto-Debit Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoicing & Compliance */}
              <div className="flex flex-col gap-2.5 text-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                  Invoicing &amp; Compliance
                </span>
                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1 font-body-sm text-body-sm text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-[11px]">Template</span>
                    <span className="font-medium text-on-surface">Standard GST B2B</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-[11px]">HSN / SAC Code</span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold text-[11px]">
                      998314 (Software IT)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-[11px]">Tax Treatment</span>
                    <span className="font-medium text-on-surface text-[11px]">
                      18% IGST / (9% CGST + 9% SGST)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-space-sm pt-space-xs text-xs border-t border-surface-container-high/30">
                <button
                  className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm transition-all text-center font-semibold"
                  type="button"
                >
                  Save Overrides
                </button>
                <button
                  className="p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
                  title="Clone Plan"
                  type="button"
                >
                  <Copy size={16} />
                </button>
                <button
                  className="p-2 rounded-lg bg-surface-container text-error hover:bg-error-container transition-colors"
                  title="Archive Tier"
                  type="button"
                >
                  <Archive size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Comprehensive Pricing Matrix & Feature Quotas DataTable */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md border border-surface-container-high/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm text-xs">
            <div className="flex flex-col gap-0.5">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base">
                Comprehensive Pricing Matrix &amp; Feature Quotas
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Detailed specification table across all production subscription variants mapped to active catalogs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                Compare:
              </span>
              <button
                type="button"
                className="px-2.5 py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold"
              >
                Standard ({mockPlans.length})
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded text-on-surface-variant hover:bg-surface-container font-label-sm text-label-sm"
              >
                Addon Packs
              </button>
            </div>
          </div>

          {/* Reusable DataTable Component */}
          <DataTable
            columns={columns}
            data={filteredPlans}
            keyExtractor={(p) => p.id}
            selectable={true}
            selectedIds={selectedPlan ? [selectedPlan.id] : []}
            onRowClick={(p) => setSelectedPlanId(p.id)}
            pageSize={10}
          />
        </div>
      </div>
    </main>
  );
}
