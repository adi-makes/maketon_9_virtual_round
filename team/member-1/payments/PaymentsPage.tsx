"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import {
  mockPayments,
  mockCustomers,
  mockInvoices,
} from "../mockData";
import { DataTable, ColumnDef } from "../components/DataTable";
import type { Database } from "../../../src/types/database";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

export function PaymentsPage() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow>(mockPayments[0]);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [gatewayFilter, setGatewayFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Helpers
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
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

  const getCustomer = (customerId: string) => {
    return mockCustomers.find((c) => c.id === customerId);
  };

  const getInvoice = (invoiceId: string) => {
    return mockInvoices.find((i) => i.id === invoiceId);
  };

  // Filtered dataset
  const filteredPayments = mockPayments.filter((p) => {
    const customer = getCustomer(p.customer_id);
    const invoice = getInvoice(p.invoice_id);
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
      statusFilter === "all" ||
      (statusFilter === "successful" && p.status === "completed") ||
      (statusFilter === "processing" && p.status === "pending") ||
      (statusFilter === "refunded" && p.status === "refunded") ||
      (statusFilter === "failed" && p.status === "failed");

    return matchesSearch && matchesGateway && matchesStatus;
  });

  // KPI Computations
  const totalReceived = mockPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = mockPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const failedOrRefunded = mockPayments.filter(
    (p) => p.status === "failed" || p.status === "refunded"
  );
  const failedAmount = failedOrRefunded.reduce((sum, p) => sum + p.amount, 0);

  // Copy Webhook Payload Handler
  const handleCopyWebhook = () => {
    if (!selectedPayment) return;
    const samplePayload = {
      entity: "event",
      event:
        selectedPayment.status === "completed"
          ? "payment.captured"
          : selectedPayment.status === "refunded"
          ? "payment.refunded"
          : "payment.pending",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: selectedPayment.reference || selectedPayment.payment_number,
            amount: Math.round(selectedPayment.amount * 100),
            currency: "INR",
            status: selectedPayment.status,
            method: selectedPayment.method,
            customer_id: selectedPayment.customer_id,
            invoice_id: selectedPayment.invoice_id,
          },
        },
      },
    };

    navigator.clipboard?.writeText(JSON.stringify(samplePayload, null, 2));
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // Method Icon & Label Component
  const renderMethodBadge = (method: PaymentRow["method"]) => {
    switch (method) {
      case "razorpay":
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">
            <QrCode size={13} className="text-primary" />
            <span>Razorpay (UPI)</span>
          </div>
        );
      case "stripe":
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">
            <CreditCard size={13} className="text-secondary" />
            <span>Stripe Card</span>
          </div>
        );
      case "bank_transfer":
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">
            <Landmark size={13} className="text-tertiary" />
            <span>Bank Transfer</span>
          </div>
        );
      case "manual_entry":
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">
            <RefreshCw size={13} className="text-outline" />
            <span>Manual Entry</span>
          </div>
        );
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: PaymentRow["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Successful
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-label-sm text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            Processing
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-label-sm text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Refunded
          </span>
        );
      case "failed":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-error font-label-sm text-[11px] font-semibold">
            <AlertCircle size={12} />
            <span>Failed</span>
          </span>
        );
    }
  };

  // Define Columns for the DataTable
  const columns: ColumnDef<PaymentRow>[] = [
    {
      header: "Payment ID",
      cell: (p) => {
        const isSelected = selectedPayment?.id === p.id;
        return (
          <div className="flex items-center gap-1.5 font-mono-data-sm text-mono-data-sm font-semibold">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSelected ? "bg-primary" : "bg-transparent"
              }`}
            />
            <span className={isSelected ? "text-primary" : "text-on-surface"}>
              {p.payment_number}
            </span>
          </div>
        );
      },
    },
    {
      header: "Customer",
      cell: (p) => {
        const customer = getCustomer(p.customer_id);
        const name = customer?.company_name || customer?.name || "Customer Entity";
        return (
          <span className="font-medium text-on-surface truncate max-w-[160px] block">
            {name}
          </span>
        );
      },
    },
    {
      header: "Invoice",
      cell: (p) => {
        const invoice = getInvoice(p.invoice_id);
        return (
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            {invoice?.invoice_number || "INV-N/A"}
          </span>
        );
      },
    },
    {
      header: "Method",
      cell: (p) => renderMethodBadge(p.method),
    },
    {
      header: "Transaction UTR",
      cell: (p) => (
        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant truncate max-w-[140px] block">
          {p.reference || "OFFLINE_RECORD"}
        </span>
      ),
    },
    {
      header: "Date & Time",
      cell: (p) => (
        <span className="whitespace-nowrap text-on-surface-variant font-body-sm text-xs">
          {formatDate(p.created_at)}
        </span>
      ),
    },
    {
      header: "Amount",
      align: "right",
      cell: (p) => (
        <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface">
          {formatINR(p.amount)}
        </span>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (p) => renderStatusBadge(p.status),
    },
    {
      header: "Actions",
      align: "right",
      cell: () => (
        <button
          type="button"
          className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
          title="Options"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical size={16} />
        </button>
      ),
    },
  ];

  // Selected payment customer & invoice details
  const inspectorCustomer = selectedPayment ? getCustomer(selectedPayment.customer_id) : null;
  const inspectorInvoice = selectedPayment ? getInvoice(selectedPayment.invoice_id) : null;
  const grossAmount = selectedPayment ? selectedPayment.amount : 0;
  const gatewayFee = grossAmount * 0.02;
  const gstOnFee = gatewayFee * 0.18;
  const netEscrow = Math.max(0, grossAmount - gatewayFee - gstOnFee);

  return (
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full space-y-space-lg">
        {/* Header / Telemetry Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold text-[11px]">
                SubscriptIQ Financial Telemetry
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-xs">
                NODE_MUMBAI_01
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight text-2xl lg:text-3xl font-semibold">
              Payments
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl text-sm">
              Monitor incoming subscription payments, payment gateway transactions, payouts, and automated retries.
            </p>
          </div>

          {/* Global Actions */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container shadow-sm transition-all font-label-md text-label-md text-xs font-medium border border-surface-container-high/30"
              type="button"
            >
              <Download size={16} className="text-on-surface-variant" />
              <span>Export Statement</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container shadow-sm transition-all font-label-md text-label-md text-xs font-semibold"
              type="button"
            >
              <Plus size={16} />
              <span>Record Offline Payment</span>
            </button>
          </div>
        </div>

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
                className="h-9 px-3 pr-8 rounded-lg bg-surface text-on-surface font-label-md text-label-md appearance-none focus:outline-none cursor-pointer border border-surface-container-high/20 text-xs"
              >
                <option value="all">All Gateways</option>
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="manual_entry">Manual Entry</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-2.5 text-on-surface-variant"
              />
            </div>

            {/* Date Range Button */}
            <button
              className="h-9 px-3 rounded-lg bg-surface text-on-surface hover:bg-surface-container flex items-center gap-1.5 font-label-md text-label-md transition-colors border border-surface-container-high/20"
              type="button"
            >
              <Calendar size={14} className="text-on-surface-variant" />
              <span>This Month</span>
            </button>

            {/* Advanced Filter Toggle */}
            <button
              className="h-9 w-9 rounded-lg bg-surface text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors border border-surface-container-high/20"
              type="button"
              aria-label="Filter Options"
            >
              <SlidersHorizontal size={16} className="text-on-surface-variant" />
            </button>
          </div>
        </div>

        {/* 4 KPI Performance Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {/* Card 1: Total Received */}
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/20">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all pointer-events-none" />
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

          {/* Card 2: Captured This Month */}
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Payments This Month
              </span>
              <div className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="my-space-md">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface text-2xl font-bold tracking-tight">
                {formatINR(totalReceived)}
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-xs">
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
                {mockPayments.filter((p) => p.status === "completed").length}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                successful captures
              </span>
            </div>
          </div>

          {/* Card 3: Pending / In Settlement */}
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Pending / In Settlement
              </span>
              <div className="p-1.5 rounded-lg bg-surface-container-high text-tertiary">
                <Clock size={18} />
              </div>
            </div>
            <div className="my-space-md">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface text-2xl font-bold tracking-tight">
                {formatINR(pendingAmount)}
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-xs">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Settlement within T+1 days
              </span>
            </div>
          </div>

          {/* Card 4: Failed Payments */}
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/20">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Failed Payments
              </span>
              <div className="p-1.5 rounded-lg bg-error-container text-error">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="my-space-md flex items-baseline gap-2">
              <span className="font-mono-data-lg text-mono-data-lg text-error text-2xl font-bold">
                {failedOrRefunded.length}
              </span>
              <span className="font-mono-data-md text-mono-data-md text-on-surface-variant text-sm">
                ({formatINR(failedAmount)})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                97.2% first-pass rate
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-medium text-[10px]">
                Dunning active
              </span>
            </div>
          </div>
        </div>

        {/* Main Multi-Tier Interface: Table + Detail Inspector */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* Left Column: Data Grid & Filters (Spans 8 cols) */}
          <div className="xl:col-span-8 flex flex-col space-y-space-md">
            {/* Multi-tier Tab Selectors */}
            <div className="flex flex-col space-y-space-xs bg-surface-container-lowest p-space-sm rounded-xl shadow-sm border border-surface-container-high/30">
              {/* Gateway Channels Tabs */}
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1 text-xs">
                {[
                  { id: "all", label: `All Gateways (${mockPayments.length})` },
                  {
                    id: "razorpay",
                    label: `Razorpay (${mockPayments.filter((p) => p.method === "razorpay").length})`,
                  },
                  {
                    id: "stripe",
                    label: `Stripe (${mockPayments.filter((p) => p.method === "stripe").length})`,
                  },
                  {
                    id: "bank_transfer",
                    label: `Bank Transfer (${mockPayments.filter((p) => p.method === "bank_transfer").length})`,
                  },
                  {
                    id: "manual_entry",
                    label: `Manual Entry (${mockPayments.filter((p) => p.method === "manual_entry").length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setGatewayFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors ${
                      gatewayFilter === tab.id
                        ? "bg-primary-container text-on-primary shadow-sm font-semibold"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status Filters (Pills) */}
              <div className="flex items-center justify-between pt-space-xs border-t border-surface-container-high/20 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant pl-1 mr-1 text-[11px] font-semibold">
                    Status:
                  </span>
                  {[
                    { id: "all", label: "All" },
                    { id: "successful", label: "Successful" },
                    { id: "processing", label: "Processing" },
                    { id: "refunded", label: "Refunded" },
                    { id: "failed", label: "Failed" },
                  ].map((statusTab) => (
                    <button
                      key={statusTab.id}
                      onClick={() => setStatusFilter(statusTab.id)}
                      className={`px-2.5 py-1 rounded font-label-md text-label-md transition-colors ${
                        statusFilter === statusTab.id
                          ? "bg-surface-container text-on-surface font-semibold"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      {statusTab.label}
                    </button>
                  ))}
                </div>
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant pr-1 hidden sm:inline text-xs">
                  Showing {filteredPayments.length} of {mockPayments.length} items
                </span>
              </div>
            </div>

            {/* Reusable DataTable Component */}
            <DataTable
              columns={columns}
              data={filteredPayments}
              keyExtractor={(p) => p.id}
              selectedIds={selectedPayment ? [selectedPayment.id] : []}
              onRowClick={(p) => setSelectedPayment(p)}
              pageSize={10}
            />

            {/* Quick Micro Telemetry Strip: Dunning Pipeline */}
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md border border-surface-container-high/30">
              <div className="flex items-center gap-space-md">
                <div className="p-2.5 rounded-lg bg-surface-container-high text-primary">
                  <RefreshCw size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                    Smart Dunning Engine (v2)
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                    Automated retry logic scheduled for failing mandate webhooks across active banking nodes.
                  </span>
                </div>
              </div>
              <button
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-surface text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors text-xs font-semibold border border-surface-container-high/20"
                type="button"
              >
                Configure Rules
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Payment Detail Inspector (Spans 4 cols) */}
          <div className="xl:col-span-4 flex flex-col space-y-space-md">
            {selectedPayment ? (
              <div className="rounded-xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col space-y-space-lg relative overflow-hidden border border-surface-container-high/30">
                {/* Header & Fast Actions */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-data-md text-mono-data-md font-semibold text-on-surface text-base">
                        {selectedPayment.payment_number}
                      </span>
                      {renderStatusBadge(selectedPayment.status)}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 text-xs">
                      Capture via {selectedPayment.method.toUpperCase()} Protocol
                    </span>
                  </div>

                  {/* Kebab actions dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-container text-on-surface-variant transition-colors border border-surface-container-high/20"
                      type="button"
                      aria-label="Payment Options"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {optionsMenuOpen && (
                      <div
                        className="absolute right-0 mt-1 w-44 rounded-lg bg-surface-container-lowest shadow-lg py-1 z-30 font-label-md text-label-md text-on-surface text-xs border border-surface-container-high/40"
                        onClick={() => setOptionsMenuOpen(false)}
                      >
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container transition-colors text-left"
                        >
                          <Receipt size={15} className="text-on-surface-variant" />
                          <span>View Receipt</span>
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container text-error transition-colors text-left"
                        >
                          <RotateCcw size={15} />
                          <span>Initiate Refund</span>
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container transition-colors text-left"
                        >
                          <Send size={15} className="text-on-surface-variant" />
                          <span>Resend Webhook</span>
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container transition-colors text-left"
                        >
                          <Download size={15} className="text-on-surface-variant" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Amount Display */}
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col space-y-space-sm border border-surface-container-high/20">
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider text-[11px]">
                    <span>Settlement Amount</span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">
                      INR (₹)
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-bold text-2xl">
                      {formatINR(grossAmount)}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-medium text-xs">
                      {selectedPayment.status === "completed" ? "Settled Payout" : "Pending Capture"}
                    </span>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant text-xs border-t border-surface-container-high/30">
                    <span className="truncate max-w-[170px]">
                      Customer: {inspectorCustomer?.company_name || inspectorCustomer?.name || "Client"}
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold">
                      {inspectorInvoice?.invoice_number || "INV-N/A"}
                    </span>
                  </div>
                </div>

                {/* Settlement Financial Breakdown */}
                <div className="flex flex-col space-y-space-xs text-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                    Fee &amp; Ledger Audit
                  </span>
                  <div className="space-y-2 py-1 font-body-sm text-body-sm">
                    <div className="flex justify-between items-center text-on-surface">
                      <span>Gross Invoice Amount</span>
                      <span className="font-mono-data-sm text-mono-data-sm font-semibold">
                        {formatINR(grossAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span>Payment Gateway Fee (2.00%)</span>
                      <span className="font-mono-data-sm text-mono-data-sm text-error">
                        - {formatINR(gatewayFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span>GST on Gateway Fee (18%)</span>
                      <span className="font-mono-data-sm text-mono-data-sm text-error">
                        - {formatINR(gstOnFee)}
                      </span>
                    </div>
                    <div className="h-0.5 bg-surface-container rounded-full my-1" />
                    <div className="flex justify-between items-center text-on-surface font-semibold">
                      <span>Net Credited to Virtual Escrow</span>
                      <span className="font-mono-data-sm text-mono-data-sm text-secondary font-bold">
                        {formatINR(netEscrow)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Execution Timeline */}
                <div className="flex flex-col space-y-space-sm text-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                    Lifecycle Telemetry
                  </span>
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-surface-container-high" />

                    <div className="relative flex flex-col">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-surface-container-lowest" />
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          Mandate Trigger Initiated
                        </span>
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
                          14:32:01
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                        Debit dispatch received by gateway engine
                      </span>
                    </div>

                    <div className="relative flex flex-col">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-surface-container-lowest" />
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          Authorized by Clearing House
                        </span>
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
                          14:32:04
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                        Pre-approved token verified successfully
                      </span>
                    </div>

                    <div className="relative flex flex-col">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-surface-container-lowest" />
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          Payment Captured
                        </span>
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
                          14:32:07
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                        Gateway confirmation received (Ref: {selectedPayment.reference || "N/A"})
                      </span>
                    </div>

                    <div className="relative flex flex-col">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-surface-container-lowest" />
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-secondary font-semibold">
                          Reconciled in Ledger
                        </span>
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
                          14:32:10
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                        Matched with {inspectorInvoice?.invoice_number || "Invoice"}. Ledger updated.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gateway Raw Payload Log Snippet */}
                <div className="flex flex-col space-y-space-xs text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                      Webhook Payload Snippet
                    </span>
                    <button
                      className="font-mono-data-sm text-mono-data-sm text-primary hover:underline flex items-center gap-1 text-xs"
                      onClick={handleCopyWebhook}
                      type="button"
                    >
                      {copiedWebhook ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-space-sm rounded-lg bg-inverse-surface text-inverse-on-surface font-mono-data-sm text-mono-data-sm overflow-x-auto text-[11px] leading-tight border border-white/10 max-h-44">
                    <pre className="m-0">
{JSON.stringify(
  {
    entity: "event",
    event:
      selectedPayment.status === "completed"
        ? "payment.captured"
        : selectedPayment.status === "refunded"
        ? "payment.refunded"
        : "payment.pending",
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: selectedPayment.reference || selectedPayment.payment_number,
          amount: Math.round(selectedPayment.amount * 100),
          currency: "INR",
          status: selectedPayment.status,
          method: selectedPayment.method,
          customer_id: selectedPayment.customer_id,
          invoice_id: selectedPayment.invoice_id,
        },
      },
    },
  },
  null,
  2
)}
                    </pre>
                  </div>
                </div>

                {/* Footer Action Buttons in Inspector */}
                <div className="pt-space-xs flex items-center gap-space-sm text-xs">
                  <button
                    className="flex-1 py-2 px-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center justify-center gap-1.5 font-medium border border-surface-container-high/30"
                    type="button"
                  >
                    <Receipt size={15} />
                    <span>View Receipt</span>
                  </button>
                  <button
                    className="py-2 px-3 rounded-lg bg-surface-container text-error hover:bg-error-container transition-colors font-label-md text-label-md flex items-center justify-center gap-1.5 font-medium border border-surface-container-high/30"
                    type="button"
                  >
                    <RotateCcw size={15} />
                    <span>Refund</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-surface-container-lowest shadow-sm p-8 text-center text-on-surface-variant border border-surface-container-high/30">
                <Receipt size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-label-md text-sm font-semibold text-on-surface">
                  No Payment Selected
                </p>
                <p className="font-body-sm text-xs mt-1">
                  Click on any payment row in the table to inspect details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default PaymentsPage;

