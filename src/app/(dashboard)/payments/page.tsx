import { PaymentsPage } from "@/components/payments/PaymentsPage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaymentsRoute() {
  const supabase = await createClient();

  const { data: livePayments } = await supabase
    .from("payments")
    .select(`
      id,
      payment_number,
      invoice_id,
      customer_id,
      amount,
      method,
      reference,
      status,
      created_at,
      customer:customers(id, name, company_name)
    `)
    .order("created_at", { ascending: false });

  const { data: unpaidInvoices } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      customer_id,
      total_amount,
      paid_amount,
      outstanding_balance,
      customer:customers(name, company_name)
    `)
    .gt("outstanding_balance", 0)
    .order("created_at", { ascending: false });

  return (
    <PaymentsPage
      initialPayments={livePayments || []}
      unpaidInvoices={unpaidInvoices || []}
    />
  );
}
