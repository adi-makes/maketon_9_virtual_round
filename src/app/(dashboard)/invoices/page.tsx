import { InvoicesPage } from "@/components/invoices/InvoicesPage";
import { getInvoices } from "@/lib/billing/invoice-service";

export const dynamic = "force-dynamic";

export default async function InvoicesRoute() {
  const liveInvoices = await getInvoices();
  return <InvoicesPage initialInvoices={liveInvoices} />;
}
