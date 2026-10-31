import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/billing/invoice-service";
import { mockInvoices, mockCustomers, mockInvoiceItems, mockPayments } from "@/lib/mock-data";
import { InvoiceDetailClient } from "./invoice-detail-client";

export const dynamic = "force-dynamic";

interface InvoiceDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = params;

  // 1. Fetch from live database
  let invoice: any = await getInvoiceById(id);

  // 2. Fallback to mock data if live record is not yet present
  if (!invoice) {
    const mock = mockInvoices.find((i) => i.id === id || i.invoice_number === id);
    if (mock) {
      const customer = mockCustomers.find((c) => c.id === mock.customer_id);
      const items = mockInvoiceItems.filter((item) => item.invoice_id === mock.id);
      const payments = mockPayments.filter((p) => p.invoice_id === mock.id);
      invoice = {
        ...mock,
        customer,
        items,
        payments,
      };
    }
  }

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailClient invoice={invoice} />;
}
