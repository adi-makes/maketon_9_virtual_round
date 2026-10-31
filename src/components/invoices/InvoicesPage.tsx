"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  CreditCard,
  X,
} from "lucide-react";
import {
  mockInvoices,
  mockCustomers,
  mockSubscriptions,
  mockInvoiceItems,
} from "@/lib/mock-data";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { Database } from "@/types/database";
import { runBillingCycleAction } from "@/actions/invoices";
import { recordPaymentAction } from "@/actions/payments";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

interface InvoicesPageProps {
  initialInvoices?: any[];
}

export function InvoicesPage({ initialInvoices }: InvoicesPageProps = {}) {
  const router = useRouter();
  const rawInvoices = initialInvoices && initialInvoices.length > 0 ? initialInvoices : mockInvoices;
  const [selectedInvoice, setSelectedInvoice] = useState<any>(rawInvoices[0]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRunningBilling, setIsRunningBilling] = useState(false);
  const [billingBanner, setBillingBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Quick Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("manual_entry");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Helper Formatters
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
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

  const getDueContext = (dueDateStr: string, status: string) => {
    if (status === "paid") return "Settled";
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)}d overdue`;
    }
    return `In ${diffDays} days`;
  };

  const getCustomer = (customerId: string, invObj?: any) => {
    if (invObj?.customer) return invObj.customer;
    return mockCustomers.find((c) => c.id === customerId);
  };

  const getSubscription = (subId: string) => {
    return mockSubscriptions.find((s) => s.id === subId);
  };

  const handleRunBillingCycle = async () => {
    setIsRunningBilling(true);
    setBillingBanner(null);
    try {
      const res = await runBillingCycleAction();
      if (res.success && res.data) {
        setBillingBanner({
          type: "success",
          message: `Billing Cycle Executed: ${res.data.invoicesCreated} invoices created, ${res.data.duplicatesAvoided} duplicates prevented. ${res.data.details}`,
        });
        router.refresh();
      } else {
        setBillingBanner({
          type: "error",
          message: res.error || "Billing run failed.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run billing cycle.";
      setBillingBanner({ type: "error", message: msg });
    } finally {
      setIsRunningBilling(false);
    }
  };

  const handleQuickPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetInvoice) return;
    setIsSubmittingPayment(true);
    setPaymentError(null);

    const formData = new FormData();
    formData.append("invoiceId", paymentTargetInvoice.id);
    formData.append("amount", paymentAmount);
    formData.append("method", paymentMethod);
    if (paymentReference) {
      formData.append("reference", paymentReference);
    }

    try {
      const res = await recordPaymentAction(formData);
      if (res.success) {
        setIsPaymentModalOpen(false);
        setBillingBanner({
          type: "success",
          message: res.message || "Payment recorded successfully.",
        });
        router.refresh();
      } else {
        setPaymentError(res.error || "Payment recording failed.");
      }
    } catch {
      setPaymentError("An unexpected error occurred while recording payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // KPI Calculations
  const totalInvoicesCount = rawInvoices.length;
  const totalVolume = rawInvoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const paidInvoices = rawInvoices.filter((i) => i.status === "paid");
  const totalSettled = paidInvoices.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);
  const settledRate = totalInvoicesCount > 0 ? Math.round((paidInvoices.length / totalInvoicesCount) * 100) : 0;

  const outstandingInvoices = rawInvoices.filter((i) => Number(i.outstanding_balance || 0) > 0);
  const totalOutstanding = rawInvoices.reduce((sum, i) => sum + Number(i.outstanding_balance || 0), 0);

  const overdueInvoices = rawInvoices.filter(
    (i) => (i.status === "confirmed" || i.status === "partially_paid") && Number(i.outstanding_balance || 0) > 0
  );
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.outstanding_balance || 0), 0);

  // Status Filter options with dynamic counts
  const filterTabs = [
    { id: "all", label: "All", count: rawInvoices.length },
    {
      id: "paid",
      label: "Paid",
      count: rawInvoices.filter((i) => i.status === "paid").length,
    },
    {
      id: "partially_paid",
      label: "Partially Paid",
      count: rawInvoices.filter((i) => i.status === "partially_paid").length,
    },
    {
      id: "confirmed",
      label: "Confirmed",
      count: rawInvoices.filter((i) => i.status === "confirmed").length,
    },
    {
      id: "draft",
      label: "Draft",
      count: rawInvoices.filter((i) => i.status === "draft").length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: rawInvoices.filter((i) => i.status === "cancelled").length,
    },
  ];

  // Filtered dataset
  const filteredInvoices = rawInvoices.filter((inv) => {
    const customer = getCustomer(inv.customer_id, inv);
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
  const renderStatusBadge = (status: string, isOverdue?: boolean) => {
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={12} /> PAID
          </span>
        );
      case "partially_paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-amber-50 text-amber-700">
            <Clock3 size={12} /> PARTIAL
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-surface-container text-on-surface-variant">
            DRAFT
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-rose-50 text-rose-700">
            CANCELLED
          </span>
        );
      case "confirmed":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-blue-50 text-blue-700">
            CONFIRMED
          </span>
        );
    }
  };

  // Define Columns for DataTable
  const columns: ColumnDef<any>[] = [
    {
      header: "Invoice #",
      cell: (inv) => {
        const isSelected = selectedInvoice?.id === inv.id;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSelected ? "bg-primary" : "bg-transparent"
              }`}
            />
            <span className="font-mono-data-sm text-mono-data-sm font-semibold text-primary">
              {inv.invoice_number}
            </span>
          </div>
        );
      },
    },
    {
      header: "Customer",
      cell: (inv) => {
        const customer = getCustomer(inv.customer_id, inv);
        return (
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface font-medium truncate max-w-[140px]">
              {customer?.company_name || customer?.name || "Client Org"}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate max-w-[140px]">
              {customer?.email || "billing@client.com"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Date",
      cell: (inv) => (
        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          {formatDate(inv.created_at)}
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
            <span
              className={`font-mono-data-sm text-mono-data-sm ${
                isOverdue ? "text-error font-medium" : "text-on-surface"
              }`}
            >
              {formatDate(inv.due_date)}
            </span>
            <span
              className={`text-[10px] font-medium ${
                isOverdue ? "text-error font-semibold" : "text-on-surface-variant"
              }`}
            >
              {dueText}
            </span>
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
      cell: (inv) => {
        const balance = Number(inv.outstanding_balance || 0);
        return (
          <div className="flex flex-col items-end">
            <span
              className={`font-mono-data-sm text-mono-data-sm font-semibold ${
                balance > 0 ? "text-error" : "text-on-surface-variant"
              }`}
            >
              {formatINR(balance)}
            </span>
            {balance > 0 && Number(inv.paid_amount) > 0 && (
              <span className="text-[10px] text-emerald-600 font-medium">
                Paid: {formatINR(inv.paid_amount)}
              </span>
            )}
          </div>
        );
      },
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
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/invoices/${inv.id}`}
            className="p-1 rounded hover:bg-surface-container text-primary hover:text-primary/80 transition-colors"
            title="Open Full Invoice"
          >
            <Eye size={15} />
          </Link>
          {Number(inv.outstanding_balance) > 0 && inv.status !== "cancelled" && (
            <button
              type="button"
              className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
              title="Record Payment"
              onClick={() => {
                setPaymentTargetInvoice(inv);
                setPaymentAmount(String(inv.outstanding_balance));
                setIsPaymentModalOpen(true);
              }}
            >
              <CreditCard size={15} />
            </button>
          )}
          <button
            type="button"
            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            title="Preview in Inspector"
            onClick={() => setSelectedInvoice(inv)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      ),
    },
  ];

  // Document Inspector Details
  const inspectorCustomer = selectedInvoice ? getCustomer(selectedInvoice.customer_id, selectedInvoice) : null;
  const inspectorSubscription = selectedInvoice ? getSubscription(selectedInvoice.subscription_id) : null;
  const inspectorLineItems = selectedInvoice?.items || mockInvoiceItems.filter((i) => i.invoice_id === selectedInvoice?.id);

  const subtotal = selectedInvoice ? Number(selectedInvoice.subtotal || 0) : 0;
  const totalTax = selectedInvoice ? Number(selectedInvoice.tax_amount || 0) : 0;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  return (
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full space-y-space-lg">
        {/* Top Header & Search Bar */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="space-y-1">
            <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-on-surface-variant uppercase tracking-wider text-xs">
              <span>Financial Ledger</span>
              <span>/</span>
              <span className="text-primary font-medium">Invoices &amp; AR</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold text-2xl lg:text-3xl">
              Invoices
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Manage billing cycles, verify tax liabilities, and monitor collections across active customer subscriptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative min-w-[220px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              />
              <input
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary shadow-sm text-xs border border-surface-container-high/30"
                placeholder="Search invoice or customer..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={handleRunBillingCycle}
              disabled={isRunningBilling}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-label-md shadow-sm transition-all font-semibold text-xs disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRunningBilling ? "animate-spin" : ""} />
              <span>{isRunningBilling ? "Processing..." : "Run Billing Cycle"}</span>
            </button>
          </div>
        </section>

        {/* Action Banner Feedback */}
        {billingBanner && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
              billingBanner.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <span>{billingBanner.message}</span>
            <button
              type="button"
              onClick={() => setBillingBanner(null)}
              className="text-xs font-semibold hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

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
              <span className="text-on-surface-variant font-label-sm text-[11px] font-medium">Avg Net 15 Days</span>
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
                <Send size={12} /> Live Ledger
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
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all text-xs ${
                    active
                      ? "bg-primary text-on-primary font-semibold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? "bg-on-primary/20 text-on-primary"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Dual-Pane Layout: Table on Left, Live Tax Inspector on Right */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Main DataTable Pane */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-space-md">
            <DataTable
              columns={columns}
              data={filteredInvoices}
              pageSize={8}
              onRowClick={(row) => setSelectedInvoice(row)}
              selectedIds={selectedInvoice ? [selectedInvoice.id] : []}
            />
          </div>

          {/* Right Inspector: Live GST Tax & Audit Breakdown */}
          <div className="lg:col-span-5 xl:col-span-4 bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-primary" />
                <span className="font-semibold text-sm text-on-surface">Invoice Details</span>
              </div>
              <span className="font-mono text-xs font-semibold text-on-surface">
                {selectedInvoice?.invoice_number || "INV-XXXX"}
              </span>
            </div>

            {selectedInvoice && (
              <div className="space-y-4 text-xs">
                {/* Customer Info */}
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Customer</span>
                  <div className="font-semibold text-on-surface">
                    {inspectorCustomer?.company_name || inspectorCustomer?.name || "Client"}
                  </div>
                  <div className="text-on-surface-variant">{inspectorCustomer?.email}</div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-on-surface-variant">Issue Date:</span>
                    <div className="font-mono font-medium">{formatDate(selectedInvoice.created_at)}</div>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Due Date:</span>
                    <div className="font-mono font-medium">{formatDate(selectedInvoice.due_date)}</div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-1.5 p-3 rounded-lg bg-surface-container-low border border-surface-container">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-mono font-medium">{formatINR(subtotal)}</span>
                  </div>
                  {Number(selectedInvoice.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span className="font-mono">- {formatINR(selectedInvoice.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-on-surface-variant">
                    <span>CGST (9%)</span>
                    <span className="font-mono">{formatINR(cgst)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>SGST (9%)</span>
                    <span className="font-mono">{formatINR(sgst)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-surface-container font-bold text-on-surface text-sm">
                    <span>Grand Total</span>
                    <span className="font-mono text-primary">{formatINR(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-on-surface-variant">
                    <span>Balance Due</span>
                    <span className="font-mono font-bold text-rose-600">
                      {formatINR(selectedInvoice.outstanding_balance)}
                    </span>
                  </div>
                </div>

                {/* Inspector Actions */}
                <div className="space-y-2 pt-2">
                  <Link
                    href={`/invoices/${selectedInvoice.id}`}
                    className="w-full py-2 bg-primary text-on-primary rounded-lg text-center font-medium text-xs hover:bg-primary/90 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Eye size={14} /> Open Full Invoice View
                  </Link>

                  {Number(selectedInvoice.outstanding_balance) > 0 && selectedInvoice.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentTargetInvoice(selectedInvoice);
                        setPaymentAmount(String(selectedInvoice.outstanding_balance));
                        setIsPaymentModalOpen(true);
                      }}
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg text-center font-medium text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CreditCard size={14} /> Record Payment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Quick Payment Modal */}
      {isPaymentModalOpen && paymentTargetInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <h2 className="text-base font-bold text-on-surface">Record Invoice Payment</h2>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentError(null);
                }}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X size={18} />
              </button>
            </div>

            {paymentError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-800 text-xs border border-rose-200">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleQuickPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">
                  Invoice
                </label>
                <div className="p-2.5 bg-surface-container-low rounded-lg font-mono text-on-surface flex justify-between">
                  <span>{paymentTargetInvoice.invoice_number}</span>
                  <span className="text-on-surface-variant font-sans">
                    Due: {formatINR(paymentTargetInvoice.outstanding_balance)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-medium mb-1">
                  Payment Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-on-surface-variant font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={paymentTargetInvoice.outstanding_balance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-2 border border-surface-container rounded-lg bg-surface text-on-surface font-mono text-xs"
                  />
                </div>
                <div className="flex justify-between mt-1 text-[11px] text-on-surface-variant">
                  <span>Max: {formatINR(paymentTargetInvoice.outstanding_balance)}</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(paymentTargetInvoice.outstanding_balance))}
                    className="text-primary hover:underline font-semibold"
                  >
                    Pay Full Balance
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-medium mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-container rounded-lg bg-surface text-on-surface capitalize text-xs"
                >
                  <option value="manual_entry">Manual Entry / Offline</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="stripe">Stripe Gateway (Simulated)</option>
                  <option value="razorpay">Razorpay Gateway (Simulated)</option>
                </select>
              </div>

              <div>
                <label className="block text-on-surface-variant font-medium mb-1">
                  Reference / UTR (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC-NEFT-9281920"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-container rounded-lg bg-surface text-on-surface font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={isSubmittingPayment}
                  className="px-3.5 py-1.5 border border-surface-container rounded-lg font-medium hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  {isSubmittingPayment ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default InvoicesPage;
