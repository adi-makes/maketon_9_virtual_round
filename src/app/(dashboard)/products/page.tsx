"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Layers,
  TrendingUp,
  Network,
  ArrowUp,
  RefreshCw,
  SlidersHorizontal,
  Plus,
  PlusCircle,
  Search,
  Download,
  Monitor,
  Cpu,
  Landmark,
  RotateCcw,
  Headphones,
  History,
  MoreVertical,
  Edit,
  CheckCircle2,
  Archive,
  ChevronRight,
  Database as DatabaseIcon,
  Zap,
} from "lucide-react";
import { mockProducts, type CatalogProduct, type ProductVariantItem } from "@/mockData";
import { DataTable, type ColumnDef } from "@/components/DataTable";

const formatINR = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export default function ProductsPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>("prod-002");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Filtered dataset
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sac_code.includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "archived" && !p.is_active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, selectedCategory, statusFilter]);

  // Selected Product for right-side Live Variant Inspector
  const selectedProduct = useMemo(() => {
    return (
      mockProducts.find((p) => p.id === selectedProductId) ||
      mockProducts[0]
    );
  }, [selectedProductId]);

  // Category Icon Resolver
  const getProductIcon = (category: string, sku: string) => {
    if (sku.includes("CORE")) return <Monitor size={20} className="text-primary" />;
    if (sku.includes("API")) return <Cpu size={20} className="text-secondary" />;
    if (sku.includes("TAX")) return <Landmark size={20} className="text-tertiary" />;
    if (sku.includes("DUN")) return <RotateCcw size={20} className="text-primary" />;
    if (sku.includes("SRV")) return <Headphones size={20} className="text-secondary" />;
    if (sku.includes("MTR")) return <Zap size={20} className="text-amber-600" />;
    return <DatabaseIcon size={20} className="text-indigo-600" />;
  };

  // Define Columns for DataTable
  const columns: ColumnDef<CatalogProduct>[] = [
    {
      header: "Product & SKU",
      cell: (p) => {
        const isSelected = selectedProduct?.id === p.id;
        return (
          <div className="flex items-start gap-3 py-1">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
              {getProductIcon(p.category, p.sku)}
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
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container-low text-[10px]">
                  SKU: {p.sku}
                </span>
                {isSelected && (
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-primary-fixed text-primary font-semibold text-[10px]">
                    SELECTED
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 text-xs">
                {p.description}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Category & SAC",
      cell: (p) => (
        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-on-surface font-medium text-xs">
            {p.category}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
            SAC {p.sac_code} ({p.gst_rate})
          </span>
        </div>
      ),
    },
    {
      header: "Base Price",
      align: "right",
      cell: (p) => (
        <div className="flex flex-col items-end">
          <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold text-xs">
            {formatINR(p.base_price)}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant text-[10px]">
            /mo
          </span>
        </div>
      ),
    },
    {
      header: "Variants",
      align: "center",
      cell: (p) => (
        <div className="inline-flex flex-col items-center">
          <span className="font-mono-data-sm text-mono-data-sm px-2 py-0.5 rounded bg-surface-container-high text-primary font-medium text-xs">
            {p.variants.length} Variants
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant text-[10px] truncate max-w-[120px]">
            {p.variants.map((v) => v.name.split(" ")[0]).join(", ")}
          </span>
        </div>
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
          {p.is_active ? "Active" : "Archived"}
        </span>
      ),
    },
    {
      header: "",
      align: "center",
      cell: (p) => {
        const isSelected = selectedProduct?.id === p.id;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProductId(p.id);
              setIsInspectorOpen(true);
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
        {/* Top Navigation & Action Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold px-2 py-0.5 rounded bg-primary-fixed text-[11px]">
                PRODUCT CATALOG &amp; SKU REGISTRY
              </span>
              <span className="text-outline-variant font-mono-data-sm text-mono-data-sm">•</span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-xs">
                TAX ENGINE v3.1
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight text-2xl lg:text-3xl font-semibold">
              Products &amp; Tiers
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm">
              Define core subscription products, usage add-ons, SAC billing codes, and modular features across multi-tier regional customer contracts.
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-space-sm text-xs">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all border border-surface-container-high/30 font-medium"
              type="button"
            >
              <RefreshCw size={15} />
              <span>Sync SAC Codes</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all border border-surface-container-high/30 font-medium"
              type="button"
            >
              <SlidersHorizontal size={15} />
              <span>Manage Categories</span>
            </button>
            <Link
              href="/products/new"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all font-semibold"
            >
              <PlusCircle size={15} />
              <span>+ Add Product</span>
            </Link>
          </div>
        </div>

        {/* KPI Ribbon: 4 Dense Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1: Active Products */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                Active Products
              </span>
              <Package size={18} className="text-primary" />
            </div>
            <div className="mt-space-sm">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                {mockProducts.filter((p) => p.is_active).length} SKUs
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-on-surface-variant text-xs">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary" />
                <span>Mapped to 4 root categories</span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs flex items-center justify-between text-on-surface-variant font-mono-data-sm text-mono-data-sm text-xs border-t border-surface-container-high/20">
              <span>Global Catalog</span>
              <span className="text-on-surface font-medium">100% Synced</span>
            </div>
          </div>

          {/* Card 2: Billed Tiers */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                Billed Tiers
              </span>
              <Layers size={18} className="text-secondary" />
            </div>
            <div className="mt-space-sm">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                {mockProducts.reduce((sum, p) => sum + p.variants.length, 0)} Variants
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-on-surface-variant text-xs">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                <span>19 Active, 5 Grandfathered</span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs flex items-center justify-between text-on-surface-variant font-mono-data-sm text-mono-data-sm text-xs border-t border-surface-container-high/20">
              <span>Median base rate</span>
              <span className="text-on-surface font-medium">₹18,500/mo</span>
            </div>
          </div>

          {/* Card 3: Top Grossing SKU */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                Top Grossing SKU
              </span>
              <TrendingUp size={18} className="text-indigo-600" />
            </div>
            <div className="mt-space-sm">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                ₹6,80,000 <span className="font-body-sm text-body-sm text-on-surface-variant text-sm font-normal">MRR</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
                <span className="text-primary font-medium">Developer API Gateway</span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs flex items-center justify-between text-on-surface-variant font-mono-data-sm text-mono-data-sm text-xs border-t border-surface-container-high/20">
              <span>Portfolio Share</span>
              <span className="text-secondary font-medium">38.4% MRR</span>
            </div>
          </div>

          {/* Card 4: Add-on Attach Rate */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                Add-on Attach Rate
              </span>
              <Network size={18} className="text-tertiary" />
            </div>
            <div className="mt-space-sm">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                42.8%
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-on-surface-variant text-xs">
                <span className="text-primary font-medium flex items-center">
                  <ArrowUp size={13} className="mr-0.5" />
                  +5.2% MoM
                </span>
                <span className="text-on-surface-variant/70">vs Q1 baseline</span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs flex items-center justify-between text-on-surface-variant font-mono-data-sm text-mono-data-sm text-xs border-t border-surface-container-high/20">
              <span>Target: 45.0%</span>
              <span className="text-on-surface font-medium">On Track</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-sm border border-surface-container-high/30 text-xs">
          <div className="flex flex-1 items-center gap-space-sm flex-wrap">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-2.5 text-on-surface-variant pointer-events-none"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-xs"
                placeholder="Filter SKU, product name, or SAC code..."
                type="text"
              />
            </div>

            {/* Categories Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: "all", label: `All (${mockProducts.length})` },
                { id: "Core Platform", label: "Core Platform" },
                { id: "Developer APIs", label: "Developer APIs" },
                { id: "FinTech Infra", label: "FinTech Infra" },
                { id: "Services", label: "Services" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-primary-container text-on-primary font-semibold shadow-xs"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Controls: Status & Export */}
          <div className="flex items-center gap-space-sm">
            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-surface-container-high/20">
              {[
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "archived", label: "Archived" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-all ${
                    statusFilter === st.id
                      ? "bg-surface-container-lowest font-medium text-on-surface shadow-xs font-semibold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  {st.label}
                </button>
              ))}
            </div>
            <button
              className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors border border-surface-container-high/20"
              title="Export SKU Manifest"
              type="button"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Master Split Layout: Product Catalog vs. Live Variant Inspector */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
          {/* LEFT: Product Architecture Catalog Table (7 cols) */}
          <div
            className={`${
              isInspectorOpen ? "xl:col-span-7" : "xl:col-span-12"
            } bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-container-high/30 transition-all`}
          >
            <div className="p-3 bg-surface-container-low/40 flex items-center justify-between border-b border-surface-container-high/30">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                  Product Modules
                </span>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant px-2 py-0.5 rounded bg-surface-container-high font-medium text-xs">
                  {filteredProducts.length} Listed
                </span>
              </div>
              <span className="text-on-surface-variant font-label-sm text-label-sm text-xs">
                Select any SKU to inspect live variants and pricing terms
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredProducts}
              keyExtractor={(p) => p.id}
              selectable={true}
              selectedIds={selectedProduct ? [selectedProduct.id] : []}
              onRowClick={(p) => {
                setSelectedProductId(p.id);
                setIsInspectorOpen(true);
              }}
              pageSize={8}
            />
          </div>

          {/* RIGHT: Selected Product Details & Variant Configuration Inspector (5 cols) */}
          {isInspectorOpen && selectedProduct && (
            <div className="xl:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-md space-y-space-md sticky top-20 border border-surface-container-high/30">
              {/* Panel Header & Quick Actions */}
              <div className="flex items-start justify-between pb-space-sm border-b border-surface-container-high/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data-sm text-mono-data-sm text-primary font-semibold px-2 py-0.5 rounded bg-primary-fixed text-xs">
                      SKU: {selectedProduct.sku}
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-xs">
                      {selectedProduct.version}
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1 tracking-tight font-semibold text-xl">
                    {selectedProduct.name}
                  </h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                    {selectedProduct.category} • {selectedProduct.classification}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                    title="Audit SKU Log"
                    type="button"
                  >
                    <History size={18} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                    title="Settings"
                    type="button"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Compliance & SAC Billing Code Widget */}
              <div className="bg-surface-container-low rounded-xl p-space-md space-y-space-sm text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                    Indian GST &amp; Invoicing Telemetry
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm px-2 py-0.5 rounded bg-surface-container-high text-primary font-semibold text-[11px]">
                    {selectedProduct.gst_rate} GST Applicable
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block text-[11px]">
                      SAC Code
                    </span>
                    <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold text-sm">
                      {selectedProduct.sac_code}
                    </span>
                  </div>
                  <div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block text-[11px]">
                      Classification
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium truncate block text-xs">
                      {selectedProduct.classification}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing Matrix & Term Discounts */}
              <div className="space-y-space-xs text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                    Billing Frequency &amp; Contract Terms
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold text-[11px]">
                    15% Discount Auto-applied
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant text-xs">
                      Monthly Cadence
                    </span>
                    <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold mt-1 text-sm">
                      {formatINR(selectedProduct.base_price)}{" "}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal text-xs">
                        /mo
                      </span>
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant/80 mt-1 text-[10px]">
                      Net billed monthly
                    </span>
                  </div>
                  <div className="p-space-sm rounded-lg bg-primary-fixed/40 flex flex-col justify-between border border-primary/20">
                    <span className="font-label-md text-label-md text-primary font-semibold text-xs">
                      Annual Contract
                    </span>
                    <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold mt-1 text-sm">
                      {formatINR(Math.round(selectedProduct.base_price * 0.85))}{" "}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal text-xs">
                        /mo
                      </span>
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-primary font-medium mt-1 text-[10px]">
                      {formatINR(Math.round(selectedProduct.base_price * 0.85 * 12))} paid annually
                    </span>
                  </div>
                </div>
              </div>

              {/* Configured Variants with Delta Surcharges */}
              <div className="space-y-space-sm pt-space-xs text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                      Configured Plan Variants
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant block text-[11px]">
                      {selectedProduct.variants.length} active customer tiers
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold hover:underline"
                    type="button"
                  >
                    <Plus size={14} />
                    <span>Add Variant</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedProduct.variants.map((v) => (
                    <div
                      key={v.id}
                      className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm hover:bg-surface-container transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold text-xs">
                            {v.name}
                          </span>
                          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container-high text-[10px]">
                            {v.price_adjustment === 0
                              ? "+₹0 base"
                              : `+${formatINR(v.price_adjustment)} base`}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant truncate text-[11px]">
                          {v.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold text-xs">
                          {formatINR(v.price)}
                        </span>
                        <button
                          type="button"
                          className="p-1 rounded text-on-surface-variant hover:text-on-surface"
                          title="Edit Variant"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Flags & Modular Entitlements */}
              <div className="p-space-sm rounded-xl bg-surface-container-low/60 space-y-space-xs text-xs border border-surface-container-high/20">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                  Modular Entitlements
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono-data-sm text-mono-data-sm text-[11px]">
                  {selectedProduct.entitlements.map((ent, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-on-surface">
                      <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                      <span className="truncate">{ent}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer for Drawer */}
              <div className="pt-space-sm flex items-center justify-between gap-space-sm border-t border-surface-container-high/30 text-xs">
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-surface-container-low text-error hover:bg-error-container hover:text-on-error-container font-label-md text-label-md transition-colors font-medium border border-surface-container-high/20"
                  type="button"
                >
                  <Archive size={15} />
                  <span>Deprecate SKU</span>
                </button>
                <div className="flex items-center gap-space-xs">
                  <button
                    className="px-3.5 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors font-medium"
                    type="button"
                  >
                    Update Pricing
                  </button>
                  <button
                    className="px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm transition-colors font-semibold"
                    type="button"
                  >
                    Save Config
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
