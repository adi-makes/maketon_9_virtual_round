"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Receipt,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Clock3,
  AlertTriangle,
  Send,
  Building,
  Mail,
  Phone,
  CreditCard,
  Lock,
  PlusCircle,
  AlertCircle,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import { recordPaymentAction } from "@/actions/payments";
import { confirmInvoiceAction, cancelInvoiceAction } from "@/actions/invoices";

interface InvoiceDetailClientProps {
  invoice: any;
}

export function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>(
    invoice.outstanding_balance > 0 ? String(invoice.outstanding_balance) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("manual_entry");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionMessage(null);

    const formData = new FormData();
    formData.append("invoiceId", invoice.id);
    formData.append("amount", paymentAmount);
    formData.append("method", paymentMethod);
    if (paymentReference) {
      formData.append("reference", paymentReference);
    }

    try {
      const res = await recordPaymentAction(formData);
      if (res.success) {
        setActionMessage({ type: "success", text: res.message || "Payment recorded successfully." });
        setIsPaymentModalOpen(false);
        router.refresh();
      } else {
        setActionMessage({ type: "error", text: res.error || "Failed to record payment." });
      }
    } catch {
      setActionMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const res = await confirmInvoiceAction(invoice.id);
      if (res.success) {
        setActionMessage({ type: "success", text: "Invoice confirmed." });
        router.refresh();
      } else {
        setActionMessage({ type: "error", text: res.error || "Failed to confirm." });
      }
    } catch {
      setActionMessage({ type: "error", text: "Error confirming invoice." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this invoice? This action cannot be undone.")) return;
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const res = await cancelInvoiceAction(invoice.id);
      if (res.success) {
        setActionMessage({ type: "success", text: "Invoice cancelled." });
        router.refresh();
      } else {
        setActionMessage({ type: "error", text: res.error || "Failed to cancel." });
      }
    } catch {
      setActionMessage({ type: "error", text: "Error cancelling invoice." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPaid = invoice.status === "paid";
  const isPartiallyPaid = invoice.status === "partially_paid";
  const isDraft = invoice.status === "draft";
  const isCancelled = invoice.status === "cancelled";

  // Tax calculations for GST breakdown
  const totalTax = Number(invoice.tax_amount || 0);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  const items = invoice.items || [];
  const payments = invoice.payments || [];
  const customer = invoice.customer;

  return (
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full space-y-space-md max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Invoices</span>
          </Link>

          <div className="flex items-center gap-2">
            {isDraft && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
              >
                <Check size={14} /> Confirm Draft
              </button>
            )}

            {!isPaid && !isCancelled && (
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
              >
                <PlusCircle size={14} /> Record Payment
              </button>
            )}

            {!isCancelled && !isPaid && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-error/40 text-error rounded-lg text-xs font-semibold hover:bg-error-container/20 transition"
              >
                <X size={14} /> Cancel Invoice
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-surface-container-high rounded-lg text-xs font-medium text-on-surface hover:bg-surface-container-high transition"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {/* Action feedback */}
        {actionMessage && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center justify-between ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-xs hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Invoice Container */}
        <div className="bg-surface-container-lowest border border-surface-container rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-surface-container">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-mono text-on-surface">
                  {invoice.invoice_number}
                </h1>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={13} /> Paid
                  </span>
                ) : isPartiallyPaid ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    <Clock3 size={13} /> Partially Paid
                  </span>
                ) : isDraft ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                    Draft
                  </span>
                ) : isCancelled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    Cancelled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    Confirmed
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Issued on {formatDate(invoice.created_at)} • Due date: {formatDate(invoice.due_date)}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs uppercase tracking-wider text-on-surface-variant block">
                Outstanding Balance
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-primary">
                {formatINR(invoice.outstanding_balance)}
              </span>
            </div>
          </div>

          {/* Billing & Subscription Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-surface-container text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-on-surface-variant">
                Billed To
              </h3>
              <div className="text-on-surface font-medium">
                {customer?.company_name || customer?.name || "Customer Organization"}
              </div>
              {customer?.name && customer?.company_name && (
                <div className="text-xs text-on-surface-variant">Attn: {customer.name}</div>
              )}
              {customer?.email && (
                <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  <Mail size={12} /> {customer.email}
                </div>
              )}
              {customer?.phone && (
                <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  <Phone size={12} /> {customer.phone}
                </div>
              )}
            </div>

            <div className="space-y-2 md:text-right">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-on-surface-variant">
                Subscription & Period
              </h3>
              <div className="text-xs text-on-surface-variant">
                <span className="text-on-surface font-medium">Billing Period: </span>
                {formatDate(invoice.billing_period_start)} – {formatDate(invoice.billing_period_end)}
              </div>
              <div className="text-xs text-on-surface-variant">
                <span className="text-on-surface font-medium">Subscription ID: </span>
                <span className="font-mono">{invoice.subscription_id?.slice(0, 8)}...</span>
              </div>
              <div className="text-xs text-on-surface-variant">
                <span className="text-on-surface font-medium">Payment Terms: </span>
                <span>Net 15 Days</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-on-surface">Billed Line Items</h3>
            <div className="overflow-x-auto border border-surface-container rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {items.length > 0 ? (
                    items.map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="hover:bg-surface-container-low/40">
                        <td className="py-3 px-4 font-medium text-on-surface">
                          {item.description || "Subscription Service"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatINR(item.unit_price)}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          {formatINR(item.amount || item.unit_price * item.quantity)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-on-surface-variant">
                        No individual line items listed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="flex flex-col sm:flex-row justify-end pt-2">
            <div className="w-full sm:w-80 space-y-2 text-xs border border-surface-container rounded-lg p-4 bg-surface-container-low/30">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-mono text-on-surface font-medium">{formatINR(invoice.subtotal)}</span>
              </div>

              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount Applied</span>
                  <span className="font-mono font-medium">- {formatINR(invoice.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-on-surface-variant">
                <span>Central GST (CGST) @ 9%</span>
                <span className="font-mono text-on-surface">{formatINR(cgst)}</span>
              </div>

              <div className="flex justify-between text-on-surface-variant">
                <span>State GST (SGST) @ 9%</span>
                <span className="font-mono text-on-surface">{formatINR(sgst)}</span>
              </div>

              <div className="border-t border-surface-container pt-2 flex justify-between text-sm font-bold text-on-surface">
                <span>Total Amount</span>
                <span className="font-mono text-primary text-base">{formatINR(invoice.total_amount)}</span>
              </div>

              <div className="flex justify-between text-on-surface-variant pt-1 border-t border-surface-container/60">
                <span>Amount Paid</span>
                <span className="font-mono text-emerald-600 font-semibold">{formatINR(invoice.paid_amount)}</span>
              </div>

              <div className="flex justify-between font-bold text-on-surface">
                <span>Outstanding Balance</span>
                <span className="font-mono text-rose-600">{formatINR(invoice.outstanding_balance)}</span>
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="space-y-3 pt-4 border-t border-surface-container">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-on-surface">Recognized Payment Transactions</h3>
              {!isPaid && !isCancelled && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <PlusCircle size={13} /> Add Payment
                </button>
              )}
            </div>

            {payments.length > 0 ? (
              <div className="overflow-x-auto border border-surface-container rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Payment Ref</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4">Reference</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-surface-container-low/40">
                        <td className="py-2.5 px-4 font-mono font-medium">{p.payment_number}</td>
                        <td className="py-2.5 px-4">{formatDate(p.created_at)}</td>
                        <td className="py-2.5 px-4 capitalize">{p.method?.replace("_", " ")}</td>
                        <td className="py-2.5 px-4 font-mono text-on-surface-variant">
                          {p.reference || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">
                No payments have been recorded against this invoice yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal Dialog */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <h2 className="text-lg font-bold text-on-surface">Record Invoice Payment</h2>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">
                  Invoice
                </label>
                <div className="p-2.5 bg-surface-container-low rounded-lg font-mono text-on-surface flex justify-between">
                  <span>{invoice.invoice_number}</span>
                  <span className="text-on-surface-variant font-sans">
                    Due: {formatINR(invoice.outstanding_balance)}
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
                    max={invoice.outstanding_balance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-2 border border-surface-container rounded-lg bg-surface text-on-surface font-mono"
                  />
                </div>
                <div className="flex justify-between mt-1 text-[11px] text-on-surface-variant">
                  <span>Max allowable: {formatINR(invoice.outstanding_balance)}</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(invoice.outstanding_balance))}
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
                  className="w-full px-3 py-2 border border-surface-container rounded-lg bg-surface text-on-surface capitalize"
                >
                  <option value="manual_entry">Manual Entry / Cash</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="stripe">Stripe Gateway (Simulated)</option>
                  <option value="razorpay">Razorpay Gateway (Simulated)</option>
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
                  className="w-full px-3 py-2 border border-surface-container rounded-lg bg-surface text-on-surface font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-surface-container rounded-lg font-medium hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  {isSubmitting ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
