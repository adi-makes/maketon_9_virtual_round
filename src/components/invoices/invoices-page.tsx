"use client";

import React, { useState } from "react";
import {
  Search,
  Calendar,
  SlidersHorizontal,
  Download,
  PlusCircle,
  Receipt,
  TrendingUp,
  CheckCircle2,
  Clock,
  Clock3,
  AlertTriangle,
  Send,
  RefreshCw,
  Columns,
  Eye,
  Edit,
  Printer,
  Lock,
  ChevronRight,
  AlertCircle,
  BellRing,
  Upload,
} from "lucide-react";
import {
  mockInvoices,
  mockCustomers,
  mockSubscriptions,
  mockInvoiceItems,
} from "@/lib/mock-data";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { Database } from "@/types/database";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

export function InvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow>(mockInvoices[0]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper Formatters
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
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

  const getDueContext = (dueDateStr: string, status: InvoiceRow["status"]) => {
    if (status === "paid") return "Settled";
    const due = new Date(dueDateStr);
    const now = new Date("2024-10-25T00:00:00Z"); // benchmark month
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)}d overdue`;
    }
    return `In ${diffDays} days`;
  };

  const getCustomer = (customerId: string) => {
    return mockCustomers.find((c) => c.id === customerId);
  };

  const getSubscription = (subId: string) => {
    return mockSubscriptions.find((s) => s.id === subId);
  };

  // KPI Calculations
  const totalInvoicesCount = mockInvoices.length;
  const totalVolume = mockInvoices.reduce((sum, i) => sum + i.total_amount, 0);

  const paidInvoices = mockInvoices.filter((i) => i.status === "paid");
  const totalSettled = paidInvoices.reduce((sum, i) => sum + i.paid_amount, 0);
  const settledRate = Math.round((paidInvoices.length / totalInvoicesCount) * 100);

  const outstandingInvoices = mockInvoices.filter((i) => i.outstanding_balance > 0);
  const totalOutstanding = mockInvoices.reduce((sum, i) => sum + i.outstanding_balance, 0);

  const overdueInvoices = mockInvoices.filter(
    (i) => (i.status === "confirmed" || i.status === "partially_paid") && i.outstanding_balance > 0
  );
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.outstanding_balance, 0);

  // Status Filter options with dynamic counts
  const filterTabs = [
    { id: "all", label: "All", count: mockInvoices.length },
    {
      id: "paid",
      label: "Paid",
      count: mockInvoices.filter((i) => i.status === "paid").length,
    },
    {
      id: "partially_paid",
      label: "Partially Paid",
      count: mockInvoices.filter((i) => i.status === "partially_paid").length,
    },
    {
      id: "confirmed",
      label: "Confirmed",
      count: mockInvoices.filter((i) => i.status === "confirmed").length,
    },
    {
      id: "draft",
      label: "Draft",
      count: mockInvoices.filter((i) => i.status === "draft").length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: mockInvoices.filter((i) => i.status === "cancelled").length,
    },
  ];

  // Filtered dataset
  const filteredInvoices = mockInvoices.filter((inv) => {
    const customer = getCustomer(inv.customer_id);
    const customerName = customer?.company_name || customer?.name || "";

    const matchesSearch =
      !searchQuery ||
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Render Status Badge
  const renderStatusBadge = (status: InvoiceRow["status"], isOverdue?: boolean) => {
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-error-container text-error">
          <AlertCircle size={12} /> OVERDUE
        </span>
      );
    }

    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-surface-container text-primary">
            <CheckCircle2 size={12} /> PAID
          </span>
        );
      case "partially_paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-surface-variant text-on-surface-variant">
            <Clock3 size={12} /> PARTIAL
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-surface-container-low text-on-surface-variant">
            <Clock size={12} /> CONFIRMED
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-surface-container-low text-on-surface-variant">
            <Edit size={12} /> DRAFT
          </span>
        );
      case "cancelled":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-slate-100 text-slate-600">
            CANCELLED
          </span>
        );
    }
  };

  // Define Columns for DataTable
  const columns: ColumnDef<InvoiceRow>[] = [
    {
      header: "Invoice #",
      cell: (inv) => {
        const isSelected = selectedInvoice?.id === inv.id;
        return (
          <div className="flex flex-col">
            <div
              className={`font-mono-data-sm text-mono-data-sm font-semibold ${
                isSelected ? "text-primary" : "text-on-surface"
              }`}
            >
              {inv.invoice_number}
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
              {formatDate(inv.created_at)}
            </div>
          </div>
        );
      },
    },
    {
      header: "Customer / GSTIN",
      cell: (inv) => {
        const customer = getCustomer(inv.customer_id);
        const name = customer?.company_name || customer?.name || "Customer Entity";
        return (
          <div className="flex flex-col max-w-[170px]">
            <div className="font-label-md text-label-md font-semibold text-on-surface truncate text-xs">
              {name}
            </div>
            <div className="font-mono-data-sm text-mono-data-sm text-on-surface-variant/70 text-[11px] truncate">
              {`29AABC${inv.customer_id.replace("cust-", "00")}R1ZM`}
            </div>
          </div>
        );
      },
    },
    {
      header: "Ref",
      cell: (inv) => (
        <span className="font-mono-data-sm text-mono-data-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">
          {inv.subscription_id.toUpperCase()}
        </span>
      ),
    },
    {
      header: "Due",
      cell: (inv) => {
        const dueText = getDueContext(inv.due_date, inv.status);
        const isOverdue = dueText.includes("overdue");
        return (
          <div className="flex flex-col">
            <div
              className={`font-label-md text-label-md text-xs ${
                isOverdue ? "text-error font-medium" : "text-on-surface"
              }`}
            >
              {formatDate(inv.due_date)}
            </div>
            <div
              className={`font-label-sm text-label-sm text-[11px] ${
                isOverdue ? "text-error" : "text-on-surface-variant"
              }`}
            >
              {dueText}
            </div>
          </div>
        );
      },
    },
    {
      header: "Total",
      align: "right",
      cell: (inv) => (
        <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
          {formatINR(inv.total_amount)}
        </span>
      ),
    },
    {
      header: "Balance",
      align: "right",
      cell: (inv) => (
        <span
          className={`font-mono-data-sm text-mono-data-sm font-medium ${
            inv.outstanding_balance > 0 ? "text-on-surface font-semibold" : "text-on-surface-variant"
          }`}
        >
          {formatINR(inv.outstanding_balance)}
        </span>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (inv) => {
        const dueText = getDueContext(inv.due_date, inv.status);
        const isOverdue = dueText.includes("overdue");
        return renderStatusBadge(inv.status, isOverdue);
      },
    },
    {
      header: "Actions",
      align: "center",
      cell: (inv) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="p-1 rounded hover:bg-surface-container-lowest text-on-surface-variant hover:text-on-surface transition-colors"
            title="View Details"
            onClick={() => setSelectedInvoice(inv)}
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-surface-container-lowest text-on-surface-variant hover:text-on-surface transition-colors"
            title="Download PDF"
          >
            <Download size={15} />
          </button>
        </div>
      ),
    },
  ];

  // Document Inspector Details
  const inspectorCustomer = selectedInvoice ? getCustomer(selectedInvoice.customer_id) : null;
  const inspectorSubscription = selectedInvoice ? getSubscription(selectedInvoice.subscription_id) : null;
  const inspectorLineItems = selectedInvoice
    ? mockInvoiceItems.filter((i) => i.invoice_id === selectedInvoice.id)
    : [];

  const subtotal = selectedInvoice ? selectedInvoice.subtotal : 0;
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const customerAddress =
    typeof inspectorCustomer?.billing_address === "object" && inspectorCustomer?.billing_address !== null
      ? (inspectorCustomer.billing_address as any)
      : null;

  return (
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full gap-space-lg">
        {/* Top Navigation & Controls Bar */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase bg-surface-container px-2 py-0.5 rounded-full font-semibold text-[11px]">
                Tax Automation &amp; Ledger
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-xs">
                FY 2024-25 Q3
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold text-2xl lg:text-3xl">
              Invoices
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm">
              Issue, manage, and track tax-compliant subscription invoices, due dates, and settlement status across institutional client accounts.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-space-sm text-xs">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/60 shadow-sm focus:outline-none focus:bg-surface-container-lowest focus:shadow-md transition-all w-60 xl:w-72 border border-surface-container-high/30 text-xs"
                placeholder="Search invoice #, GSTIN, entity..."
                type="text"
              />
            </div>

            <div className="flex items-center bg-surface-container-lowest rounded-lg p-1 shadow-sm border border-surface-container-high/30">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors font-medium text-xs"
                type="button"
              >
                <Calendar size={14} className="text-on-surface-variant" />
                <span>1 Oct - 31 Oct</span>
              </button>
              <span className="w-[1px] h-4 bg-surface-container-high mx-1" />
              <button
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors text-xs"
                type="button"
              >
                <SlidersHorizontal size={14} />
                <span>Filter</span>
              </button>
            </div>

            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md shadow-sm transition-all border border-surface-container-high/30 font-medium"
              type="button"
            >
              <Download size={16} />
              <span>Bulk Export</span>
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary shadow-sm hover:shadow transition-all font-semibold"
              type="button"
            >
              <PlusCircle size={16} />
              <span>Create Invoice</span>
            </button>
          </div>
        </section>

        {/* Financial KPI Metrics (4 Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
          {/* Card 1: Total Invoices */}
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                  Total Invoices
                </span>
                <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold mt-1 text-2xl">
                  {totalInvoicesCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Receipt size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant font-mono-data-sm text-mono-data-sm bg-surface-container-low/50 -mx-space-md -mb-space-md px-space-md py-2.5 text-xs">
              <span className="flex items-center gap-1 text-on-surface font-medium">
                <span>{formatINR(totalVolume)}</span>
                <span className="text-on-surface-variant font-normal font-body-sm text-[11px]">vol</span>
              </span>
              <span className="inline-flex items-center gap-0.5 text-secondary font-medium font-label-sm text-[11px]">
                <TrendingUp size={12} className="mr-0.5" /> +14.2% MoM
              </span>
            </div>
          </div>

          {/* Card 2: Settled & Collected */}
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                  Settled &amp; Collected
                </span>
                <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold mt-1 text-2xl">
                  {paidInvoices.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant font-mono-data-sm text-mono-data-sm bg-surface-container-low/50 -mx-space-md -mb-space-md px-space-md py-2.5 text-xs">
              <span className="flex items-center gap-1 text-on-surface font-medium">
                <span>{formatINR(totalSettled)}</span>
                <span className="text-on-surface-variant font-normal font-body-sm text-[11px]">realized</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container font-mono-data-sm text-primary font-semibold text-[11px]">
                {settledRate}% Rate
              </span>
            </div>
          </div>

          {/* Card 3: Outstanding AR */}
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                  Outstanding AR
                </span>
                <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold mt-1 text-2xl">
                  {formatINR(totalOutstanding)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:scale-105 transition-transform">
                <Clock size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant font-mono-data-sm text-mono-data-sm bg-surface-container-low/50 -mx-space-md -mb-space-md px-space-md py-2.5 text-xs">
              <span className="flex items-center gap-1 text-on-surface font-medium">
                <span>{outstandingInvoices.length}</span>
                <span className="text-on-surface-variant font-normal font-body-sm text-[11px]">pending accounts</span>
              </span>
              <span className="text-on-surface-variant font-label-sm text-[11px] font-medium">Avg Net 14 Days</span>
            </div>
          </div>

          {/* Card 4: Dunning / Overdue */}
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-label-sm text-label-sm text-error uppercase tracking-wider font-semibold text-[11px]">
                  Dunning / Overdue
                </span>
                <div className="font-headline-lg text-headline-lg text-error tracking-tight font-semibold mt-1 text-2xl">
                  {overdueInvoices.length} Invoices
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-error group-hover:scale-105 transition-transform">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-on-error-container font-mono-data-sm text-mono-data-sm bg-error-container/40 -mx-space-md -mb-space-md px-space-md py-2.5 text-xs">
              <span className="flex items-center gap-1 font-semibold text-error">
                <span>{formatINR(overdueAmount)}</span>
                <span className="font-normal font-body-sm text-[11px]">at risk</span>
              </span>
              <span className="inline-flex items-center gap-1 text-error font-label-sm text-[11px] font-semibold">
                <Send size={12} /> Dunning Live
              </span>
            </div>
          </div>
        </section>

        {/* Filter Pills Bar */}
        <section className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest p-2.5 rounded-xl shadow-sm border border-surface-container-high/30">
          <div className="flex flex-wrap items-center gap-1.5" id="statusFilterGroup">
            {filterTabs.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md font-medium transition-all text-xs ${
                    active
                      ? "bg-primary-container text-on-primary shadow-sm font-semibold"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                  data-filter={tab.id}
                >
                  {tab.label}{" "}
                  <span
                    className={`ml-1 font-mono-data-sm text-[11px] ${
                      active ? "opacity-90" : "opacity-75"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-space-sm pl-2 text-xs">
            <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Auto-sync with GSTN API</span>
            </div>
            <button
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Reload live entries"
              type="button"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </section>

        {/* Interactive Split Workspace: Invoices Ledger (7 Cols) & Live Tax Preview (5 Cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Ledger Table (Left Side, 7 Cols on desktop) */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-container-high/30">
            {/* Table Header & Controls */}
            <div className="px-space-md py-3.5 bg-surface-container-low/40 flex items-center justify-between border-b border-surface-container-high/30">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                  Ledger Entries
                </span>
                <span className="px-2 py-0.5 rounded-md bg-surface-container font-mono-data-sm text-on-surface-variant text-[11px]">
                  Showing {filteredInvoices.length} entries
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-sm text-label-sm flex items-center gap-1 text-xs"
                >
                  <Columns size={14} /> Customize Columns
                </button>
              </div>
            </div>

            {/* Reusable DataTable Component */}
            <DataTable
              columns={columns}
              data={filteredInvoices}
              keyExtractor={(inv) => inv.id}
              selectedIds={selectedInvoice ? [selectedInvoice.id] : []}
              onRowClick={(inv) => setSelectedInvoice(inv)}
              pageSize={10}
            />
          </div>

          {/* Live Printable Tax Invoice Detail Panel (Right Side, 5 Cols on desktop) */}
          <div
            className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col justify-between relative overflow-hidden border border-surface-container-high/30"
            id="invoicePreviewPanel"
          >
            {/* Ambient Top Watermark / Status Ribbon */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container" />

            <div>
              {/* Preview Actions Bar */}
              <div className="flex items-center justify-between pb-space-md mb-space-md border-b border-surface-container text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                    Document Inspector
                  </span>
                  <span className="font-mono-data-sm text-mono-data-sm px-1.5 py-0.5 rounded bg-surface-container text-primary font-bold text-[10px]">
                    GST-READY
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-sm text-label-sm font-medium border border-surface-container-high/20"
                    onClick={() => window.print()}
                    type="button"
                  >
                    <Printer size={15} />
                    <span>Print</span>
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-sm text-label-sm shadow-sm font-semibold"
                    type="button"
                  >
                    <Download size={15} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div className="space-y-space-md bg-surface-container-lowest">
                {/* Header: Issuer vs Tax Title */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs">
                        IQ
                      </div>
                      <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface text-sm">
                        SubscriptIQ Technologies Pvt Ltd
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-xs">
                      Outer Ring Road, Kadubeesanahalli, Bengaluru, Karnataka 560103
                      <br />
                      <span className="font-mono-data-sm text-mono-data-sm font-medium text-on-surface">
                        GSTIN: 29AABCU9603R1ZM
                      </span>{" "}
                      • PAN: AABCU9603R
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary text-sm">
                      TAX INVOICE
                    </div>
                    <div className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface text-xs">
                      {selectedInvoice?.invoice_number || "INV-XXXX"}
                    </div>
                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-bold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />{" "}
                      {selectedInvoice?.status.toUpperCase() || "PENDING"}
                    </div>
                  </div>
                </div>

                {/* Billed To / Metadata Grid */}
                <div className="grid grid-cols-2 gap-space-sm p-3 rounded-lg bg-surface-container-low/70 border border-surface-container-high/30">
                  <div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold text-[10px]">
                      Billed To
                    </div>
                    <div className="font-label-md text-label-md font-semibold text-on-surface mt-0.5 text-xs">
                      {inspectorCustomer?.company_name || inspectorCustomer?.name || "Client Name"}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant leading-tight mt-1 text-[11px]">
                      {customerAddress?.line1 || "Corporate Office Park"}
                      <br />
                      {customerAddress?.city || "Bengaluru"}, {customerAddress?.state || "Karnataka"}{" "}
                      {customerAddress?.postal_code || "560100"}
                    </div>
                    <div className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px] mt-1">
                      GSTIN:{" "}
                      <span className="text-on-surface font-medium">
                        {`29AABC${selectedInvoice?.customer_id.replace("cust-", "00")}R1ZM`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-1 font-mono-data-sm text-mono-data-sm text-xs">
                    <div>
                      <span className="text-on-surface-variant font-label-sm text-[10px] uppercase block font-body-sm">
                        Invoice Date
                      </span>
                      <span className="text-on-surface font-medium">
                        {formatDate(selectedInvoice?.created_at || null)}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-label-sm text-[10px] uppercase block font-body-sm">
                        Due Date
                      </span>
                      <span className="text-on-surface font-medium">
                        {formatDate(selectedInvoice?.due_date || null)}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-label-sm text-[10px] uppercase block font-body-sm">
                        Subscription ID
                      </span>
                      <span className="text-primary font-semibold text-[11px]">
                        {selectedInvoice?.subscription_id.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-1 text-xs">
                  <div className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold px-2 py-1 bg-surface-container-low flex justify-between text-[11px] rounded">
                    <span>Item Description &amp; SAC Code</span>
                    <span>Amount (INR)</span>
                  </div>
                  <div className="divide-y divide-surface-container text-body-sm font-body-sm">
                    {inspectorLineItems.length > 0 ? (
                      inspectorLineItems.map((item) => (
                        <div key={item.id} className="py-2 px-2 flex items-start justify-between">
                          <div>
                            <div className="font-medium text-on-surface text-xs">
                              {item.description}
                            </div>
                            <div className="font-mono-data-sm text-mono-data-sm text-on-surface-variant/70 text-[11px]">
                              Qty: {item.quantity} • SAC 998314
                            </div>
                          </div>
                          <div className="font-mono-data-sm text-mono-data-sm font-medium text-on-surface text-right text-xs">
                            {formatINR(item.amount)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 px-2 flex items-start justify-between">
                        <div>
                          <div className="font-medium text-on-surface text-xs">
                            SubscriptIQ Platform Enterprise Plan (Cycle Billing)
                          </div>
                          <div className="font-mono-data-sm text-mono-data-sm text-on-surface-variant/70 text-[11px]">
                            SAC 998314 • Recurring Subscription SLA
                          </div>
                        </div>
                        <div className="font-mono-data-sm text-mono-data-sm font-medium text-on-surface text-right text-xs">
                          {formatINR(subtotal)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax Computations & Totals Grid */}
                <div className="pt-2 border-t border-surface-container space-y-1.5 text-xs">
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Taxable Value (Subtotal)</span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">
                      {formatINR(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">Central GST (CGST) @ 9.0%</span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface">
                      {formatINR(cgst)}
                    </span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">State GST (SGST) @ 9.0%</span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface">
                      {formatINR(sgst)}
                    </span>
                  </div>
                  {selectedInvoice && selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between font-body-sm text-body-sm text-emerald-600">
                      <span>Discount Applied</span>
                      <span className="font-mono-data-sm text-mono-data-sm font-semibold">
                        - {formatINR(selectedInvoice.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-surface-container font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                    <span className="font-label-lg text-label-lg font-bold">Grand Total (INR)</span>
                    <span className="font-mono-data-lg text-mono-data-lg text-primary font-bold text-lg">
                      {formatINR(selectedInvoice?.total_amount || 0)}
                    </span>
                  </div>

                  {/* Settlement breakdown banner */}
                  <div className="p-2.5 rounded-lg bg-surface-container-high/60 flex items-center justify-between font-mono-data-sm text-mono-data-sm mt-2 text-xs border border-surface-container-high/40">
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                      <span>
                        {selectedInvoice?.status === "paid"
                          ? "Paid via NetBanking / AutoPay"
                          : selectedInvoice?.status === "partially_paid"
                          ? "Partially Paid"
                          : "Awaiting Gateway Capture"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-on-surface-variant">Balance Due: </span>
                      <span className="font-bold text-on-surface">
                        {formatINR(selectedInvoice?.outstanding_balance || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Account & Compliance Footer */}
                <div className="pt-2 border-t border-surface-container flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm text-[11px]">
                  <div className="space-y-0.5 leading-tight">
                    <div>
                      Bank:{" "}
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
                        HDFC Bank Ltd • A/C: 50200084920192
                      </span>
                    </div>
                    <div>
                      IFSC:{" "}
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
                        HDFC0000053
                      </span>{" "}
                      • Branch: Indiranagar, BLR
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block text-[10px]">
                      Authorized Signatory
                    </span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      SubscriptIQ Systems
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Footnote */}
            <div className="mt-space-md pt-space-sm border-t border-surface-container flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant text-xs">
              <span className="flex items-center gap-1">
                <Lock size={13} className="text-emerald-600" /> 256-bit Digitally Signed
              </span>
              <button
                type="button"
                className="text-primary hover:underline font-medium flex items-center gap-0.5"
              >
                <span>Verify IRN on NIC Portal</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default InvoicesPage;

