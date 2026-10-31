"use client";

/**
 * Simulated pay button for the customer self-service portal.
 *
 * This component renders a "Pay Now (Simulated)" button beside an unpaid invoice.
 * On click, it calls the portalPayInvoiceAction server action which:
 *   1. Verifies the authenticated user owns the invoice (server-side check).
 *   2. Records a simulated full payment for the outstanding balance.
 *
 * NOTE: No real money movement occurs. This is a demonstration payment flow.
 * Label reads "Simulated" to make this explicit to evaluators and users.
 */

import React, { useState, useTransition } from "react";
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { portalPayInvoiceAction } from "@/actions/portal-payments";
import { formatCurrency } from "@/lib/utils";

interface PortalPayButtonProps {
  invoiceId: string;
  outstandingBalance: number;
  invoiceNumber: string;
}

export function PortalPayButton({
  invoiceId,
  outstandingBalance,
  invoiceNumber,
}: PortalPayButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handlePay() {
    startTransition(async () => {
      setResult(null);
      const res = await portalPayInvoiceAction(invoiceId);
      if (res.success) {
        setResult({
          type: "success",
          message: `Payment of ${formatCurrency(outstandingBalance)} for ${invoiceNumber} recorded successfully (simulated).`,
        });
      } else {
        setResult({
          type: "error",
          message: res.error || "Payment could not be processed.",
        });
      }
    });
  }

  if (result?.type === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Paid (Simulated)
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handlePay}
        disabled={isPending}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        title={`Pay ${formatCurrency(outstandingBalance)} — Simulated payment, no real money transferred`}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CreditCard className="h-3.5 w-3.5" />
        )}
        {isPending ? "Processing…" : "Pay Now (Simulated)"}
      </button>
      {result?.type === "error" && (
        <span className="inline-flex items-center gap-1 text-[11px] text-red-600">
          <AlertCircle className="h-3 w-3" />
          {result.message}
        </span>
      )}
    </div>
  );
}
