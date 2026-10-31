"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Plus,
  Search,
  ChevronDown,
  Calendar,
  SlidersHorizontal,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Landmark,
  CreditCard,
  RefreshCw,
  MoreVertical,
  MoreHorizontal,
  Receipt,
  RotateCcw,
  Send,
  Copy,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import {
  mockPayments,
  mockCustomers,
  mockInvoices,
} from "@/lib/mock-data";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { Database } from "@/types/database";
import { recordPaymentAction } from "@/actions/payments";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

interface PaymentsPageProps {
  initialPayments?: any[];
  unpaidInvoices?: any[];
}

export function PaymentsPage({ initialPayments, unpaidInvoices = [] }: PaymentsPageProps = {}) {
  const router = useRouter();
  const rawPayments = initialPayments && initialPayments.length > 0 ? initialPayments : mockPayments;
  const [selectedPayment, setSelectedPayment] = useState<any>(rawPayments[0]);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [gatewayFilter, setGatewayFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Record Payment Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [targetInvoiceId, setTargetInvoiceId] = useState<string>(
    unpaidInvoices.length > 0 ? unpaidInvoices[0].id : ""
  );
  const [paymentAmount, setPaymentAmount] = useState<string>(
    unpaidInvoices.length > 0 ? String(unpaidInvoices[0].outstanding_balance) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("manual_entry");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Helpers
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCustomer = (customerId: string, payObj?: any) => {
    if (payObj?.customer) return payObj.customer;
    return mockCustomers.find((c) => c.id === customerId);
  };

  const getInvoice = (invoiceId: string) => {
    const foundInUnpaid = unpaidInvoices.find((i) => i.id === invoiceId);
    if (foundInUnpaid) return foundInUnpaid;
    return mockInvoices.find((i) => i.id === invoiceId);
  };

  const handleSelectInvoice = (invId: string) => {
    setTargetInvoiceId(invId);
    const chosen = unpaidInvoices.find((i) => i.id === invId);
    if (chosen) {
      setPaymentAmount(String(chosen.outstanding_balance));
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceId) {
      setFeedback({ type: "error", text: "Please select an invoice." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("invoiceId", targetInvoiceId);
    formData.append("amount", paymentAmount);
    formData.append("method", paymentMethod);
    if (paymentReference) {
      formData.append("reference", paymentReference);
    }

    try {
      const res = await recordPaymentAction(formData);
      if (res.success) {
        setIsRecordModalOpen(false);
        setFeedback({ type: "success", text: res.message || "Payment recorded successfully." });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to record payment." });
      }
    } catch {
      setFeedback({ type: "error", text: "Unexpected error recording payment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered dataset
  const filteredPayments = rawPayments.filter((p: any) => {
    const customer = getCustomer(p.customer_id, p);
    const customerName = customer?.company_name || customer?.name || "";

    const matchesSearch =
      !searchQuery ||
      p.payment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.reference && p.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGateway =
      gatewayFilter === "all" ||
      (gatewayFilter === "razorpay" && p.method === "razorpay") ||
      (gatewayFilter === "stripe" && p.method === "stripe") ||
      (gatewayFilter === "bank_transfer" && p.method === "bank_transfer") ||
      (gatewayFilter === "manual_entry" && p.method === "manual_entry");

    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesGateway && matchesStatus;
  });

  // KPI Computations
  const totalReceived = rawPayments
    .filter((p: any) => p.status === "completed")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const pendingAmount = rawPayments
    .filter((p: any) => p.status === "pending")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const failedOrRefunded = rawPayments.filter(
    (p: any) => p.status === "failed" || p.status === "refunded"
  );

  const copySimulatedWebhook = () => {
    if (!selectedPayment) return;
    const payload = JSON.stringify(
      {
        event:
          selectedPayment.status === "completed"
            ? "payment.captured"
            : selectedPayment.status === "refunded"
            ? "payment.refunded"
            : "payment.failed",
        data: {
          id: selectedPayment.reference || selectedPayment.payment_number,
          amount: Math.round(selectedPayment.amount * 100),
          currency: "INR",
          status: selectedPayment.status,
          method: selectedPayment.method,
          customer_id: selectedPayment.customer_id,
          invoice_id: selectedPayment.invoice_id,
        },
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const renderMethodBadge = (method: string) => {
    switch (method) {
      case "razorpay":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-blue-50 text-blue-700">
            <QrCode size={12} /> UPI / Razorpay
          </span>
        );
      case "stripe":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-purple-50 text-purple-700">
            <CreditCard size={12} /> Stripe Card
          </span>
        );
      case "bank_transfer":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            <Landmark size={12} /> Bank Transfer
          </span>
        );
      case "manual_entry":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-surface-container text-on-surface-variant">
            <Receipt size={12} /> Manual / Offline
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={12} /> SETTLED
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-amber-50 text-amber-700">
            <Clock size={12} /> PROCESSING
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-rose-50 text-rose-700">
            <RotateCcw size={12} /> REFUNDED
          </span>
        );
      case "failed":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-error-container text-error">
            <AlertCircle size={12} /> FAILED
          </span>
        );
    }
  };

  // Define Columns for Reusable DataTable
  const columns: ColumnDef<any>[] = [
    {
      header: "Payment ID",
      cell: (p) => {
        const isSelected = selectedPayment?.id === p.id;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSelected ? "bg-primary" : "bg-transparent"
              }`}
            />
            <span className="font-mono-data-sm text-mono-data-sm font-semibold text-primary">
              {p.payment_number}
            </span>
          </div>
        );
      },
    },
    {
      header: "Customer",
      cell: (p) => {
        const customer = getCustomer(p.customer_id, p);
        return (
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface font-medium truncate max-w-[140px]">
              {customer?.company_name || customer?.name || "Client Org"}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] font-mono truncate max-w-[140px]">
              {p.reference || "N/A"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Invoice",
      cell: (p) => {
        const inv = getInvoice(p.invoice_id);
        return (
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
            {inv?.invoice_number || `INV-${p.invoice_id?.slice(0, 8)}`}
          </span>
        );
      },
    },
    {
      header: "Method",
      cell: (p) => renderMethodBadge(p.method),
    },
    {
      header: "Amount",
      align: "right",
      cell: (p) => (
        <span className="font-mono-data-sm text-mono-data-sm font-bold text-on-surface">
          {formatINR(p.amount)}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (p) => (
        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-xs">
          {formatDate(p.created_at)}
        </span>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (p) => renderStatusBadge(p.status),
    },
  ];

  // Document Inspector Details
  const inspectorCustomer = selectedPayment ? getCustomer(selectedPayment.customer_id, selectedPayment) : null;
  const inspectorInvoice = selectedPayment ? getInvoice(selectedPayment.invoice_id) : null;
  const grossAmount = selectedPayment ? Number(selectedPayment.amount || 0) : 0;
  const estimatedGstFee = Math.round(grossAmount * 0.02 * 1.18 * 100) / 100;
  const netSettlement = Math.max(0, grossAmount - estimatedGstFee);

  return (
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full space-y-space-lg">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="space-y-1">
            <div className="flex items-center gap-space-xs font-mono-data-sm text-mono-data-sm text-on-surface-variant uppercase tracking-wider text-xs">
              <span>Financial Ledger</span>
              <span>/</span>
              <span className="text-primary font-medium">Transactions</span>
              <span>/</span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-xs">
                NODE_MUMBAI_01
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight text-2xl lg:text-3xl font-semibold">
              Payments
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl text-sm">
              Monitor incoming subscription payments, payment gateway transactions, payouts, and manual offline recordings.
            </p>
          </div>

          {/* Global Actions */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all font-label-md text-label-md text-xs font-semibold"
              type="button"
            >
              <Plus size={16} />
              <span>Record Offline Payment</span>
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Operational Filtration Bar */}
        <div className="p-space-sm rounded-xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-sm border border-surface-container-high/30">
          <div className="flex-1 relative flex items-center min-w-0">
            <Search size={18} className="absolute left-3 text-on-surface-variant pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-low transition-all text-xs"
              placeholder="Filter by payment ID, transaction ref, customer..."
              type="text"
            />
          </div>

          <div className="flex flex-wrap items-center gap-space-xs text-xs">
            {/* Gateway Filter Dropdown */}
            <div className="relative">
              <select
                value={gatewayFilter}
                onChange={(e) => setGatewayFilter(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-lg bg-surface font-label-md text-label-md text-on-surface cursor-pointer appearance-none focus:outline-none focus:bg-surface-container-low border border-surface-container-high/20"
              >
                <option value="all">All Gateways</option>
                <option value="manual_entry">Manual / Offline</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-lg bg-surface font-label-md text-label-md text-on-surface cursor-pointer appearance-none focus:outline-none focus:bg-surface-container-low border border-surface-container-high/20"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed / Settled</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
            </div>
          </div>
        </div>

        {/* 4 KPI Performance Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {/* Card 1: Total Received */}
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Total Payments Received
              </span>
              <div className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                <Wallet size={18} />
              </div>
            </div>
            <div className="my-space-md">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface text-2xl font-bold tracking-tight">
                {formatINR(totalReceived)}
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-xs">
              <span className="flex items-center text-secondary text-label-sm font-label-sm font-semibold">
                <TrendingUp size={14} className="mr-0.5" />
                +16.4%
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">MoM growth</span>
            </div>
          </div>

          {/* Card 2: Captured Payments */}
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Settled Transactions
              </span>
              <div className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="my-space-md">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface text-2xl font-bold tracking-tight">
                {rawPayments.filter((p: any) => p.status === "completed").length} Txns
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-xs">
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
                100% Reconciliation
              </span>
            </div>
          </div>

          {/* Card 3: In Flight */}
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                In-Flight / Pending
              </span>
              <div className="p-1.5 rounded-lg bg-surface-container-high text-amber-600">
                <Clock size={18} />
              </div>
            </div>
            <div className="my-space-md">
              <span className="font-mono-data-lg text-mono-data-lg text-amber-600 text-2xl font-bold tracking-tight">
                {formatINR(pendingAmount)}
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-xs">
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                Standard clearance: 24h
              </span>
            </div>
          </div>

          {/* Card 4: Failed or Exceptions */}
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-error text-[11px] font-semibold">
                Exceptions &amp; Refunds
              </span>
              <div className="p-1.5 rounded-lg bg-error-container text-error">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="my-space-md">
              <span className="font-mono-data-lg text-mono-data-lg text-error text-2xl font-bold tracking-tight">
                {failedOrRefunded.length}
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-xs text-error font-medium">
              <span>Automatic dunning active</span>
            </div>
          </div>
        </div>

        {/* Dual Pane Layout: Main Transaction Table + Deep Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
          {/* Main Table Column */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-space-md">
            <DataTable
              columns={columns}
              data={filteredPayments}
              pageSize={8}
              onRowClick={(row) => setSelectedPayment(row)}
              selectedIds={selectedPayment ? [selectedPayment.id] : []}
            />
          </div>

          {/* Right Inspector: Transaction Details */}
          <div className="lg:col-span-5 xl:col-span-4 bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-primary" />
                <span className="font-semibold text-sm text-on-surface">Payment Audit</span>
              </div>
              <span className="font-mono text-xs font-semibold text-on-surface">
                {selectedPayment?.payment_number || "PAY-XXXX"}
              </span>
            </div>

            {selectedPayment ? (
              <div className="space-y-4 text-xs">
                {/* Customer */}
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Customer</span>
                  <div className="font-semibold text-on-surface">
                    {inspectorCustomer?.company_name || inspectorCustomer?.name || "Client"}
                  </div>
                  <div className="text-on-surface-variant">{inspectorCustomer?.email}</div>
                </div>

                {/* Amount & Method */}
                <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container space-y-2">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Amount Received</span>
                    <span className="font-mono font-bold text-primary text-sm">{formatINR(grossAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Method</span>
                    <span className="capitalize font-medium">{selectedPayment.method?.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Reference / UTR</span>
                    <span className="font-mono text-on-surface">{selectedPayment.reference || "—"}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-surface-container">
                    <span className="text-on-surface-variant">Status</span>
                    {renderStatusBadge(selectedPayment.status)}
                  </div>
                </div>

                {/* Associated Invoice */}
                {inspectorInvoice && (
                  <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block">
                      Settled Against Invoice
                    </span>
                    <div className="font-mono font-semibold text-primary">
                      {inspectorInvoice.invoice_number}
                    </div>
                    <div className="flex justify-between text-on-surface-variant text-[11px]">
                      <span>Invoice Total: {formatINR(inspectorInvoice.total_amount)}</span>
                      <span>Remaining Balance: {formatINR(inspectorInvoice.outstanding_balance)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">Select a payment to inspect.</p>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <h2 className="text-base font-bold text-on-surface">Record Offline Payment</h2>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">
                  Target Invoice (Outstanding)
                </label>
                {unpaidInvoices.length > 0 ? (
                  <select
                    value={targetInvoiceId}
                    onChange={(e) => handleSelectInvoice(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-surface-container rounded-lg bg-surface text-on-surface text-xs"
                  >
                    {unpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} — {inv.customer?.company_name || inv.customer?.name || "Client"} (Due: ₹{inv.outstanding_balance})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter Invoice UUID"
                    value={targetInvoiceId}
                    onChange={(e) => setTargetInvoiceId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-surface-container rounded-lg bg-surface text-on-surface font-mono text-xs"
                  />
                )}
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
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-2 border border-surface-container rounded-lg bg-surface text-on-surface font-mono text-xs"
                  />
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
                  <option value="manual_entry">Manual Entry / Cash</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="stripe">Stripe (Simulated)</option>
                  <option value="razorpay">Razorpay (Simulated)</option>
                </select>
              </div>

              <div>
                <label className="block text-on-surface-variant font-medium mb-1">
                  Transaction Reference / UTR
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
                  onClick={() => setIsRecordModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 border border-surface-container rounded-lg font-medium hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  {isSubmitting ? "Recording..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default PaymentsPage;
