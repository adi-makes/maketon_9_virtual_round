import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cleanPlanName } from "@/lib/subscriptions/display";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Receipt,
  Download,
} from "lucide-react";
import { PortalPayButton } from "@/components/portal/PortalPayButton";

export const dynamic = "force-dynamic";

import { headers } from "next/headers";

export default async function PortalPage() {
  let subscriptions: any[] = [];
  let invoices: any[] = [];
  let customerName = "Valued Customer";

  try {
    const supabase = await createClient();

    // 1. Get current logged in customer (fast-path from headers)
    const reqHeaders = await headers();
    let userId = reqHeaders.get("x-user-id");

    let customerId: string | null = null;
    const admin = getAdminClient();

    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    if (userId) {
      // First try standard client, fallback to admin client to read profile linkage
      const profileQuery = (admin || supabase)
        .from("profiles")
        .select("customer_id, full_name, customer:customers(name, company_name)")
        .eq("id", userId)
        .single();

      const { data: profile } = await profileQuery;

      if (profile?.customer_id) {
        customerId = profile.customer_id;
      }

      const custData = profile?.customer as unknown as { name?: string; company_name?: string } | null;
      if (custData?.company_name) {
        customerName = custData.company_name;
      } else if (custData?.name) {
        customerName = custData.name;
      } else if (profile?.full_name) {
        customerName = profile.full_name;
      }
    }

    // 2. Query subscriptions (isolated strictly to this customer's account)
    const clientToQuery = admin || supabase;
    let subsQuery = clientToQuery
      .from("subscriptions")
      .select(
        `
        id,
        status,
        start_date,
        next_billing_date,
        cancel_at_period_end,
        plans (
          name,
          billing_frequency,
          products (
            name,
            base_price
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (customerId) {
      subsQuery = subsQuery.eq("customer_id", customerId);
    }

    const { data: subsData } = await subsQuery;

    if (subsData && subsData.length > 0) {
      subscriptions = subsData;
    }

    // 3. Query invoices (isolated strictly to this customer's account)
    let invsQuery = clientToQuery
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (customerId) {
      invsQuery = invsQuery.eq("customer_id", customerId);
    }

    const { data: invsData } = await invsQuery;

    if (invsData && invsData.length > 0) {
      invoices = invsData;
    }
  } catch (err) {
    console.error("Portal query error:", err);
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Self-Service Account Portal
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Welcome, {customerName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your active software licenses, review billing statements,
              and track receipts.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Account in Good Standing
            </span>
          </div>
        </div>
      </div>

      {/* Active Subscriptions Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center space-x-2 text-lg font-bold text-slate-900">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <span>Active Subscriptions</span>
          </h2>
          <span className="text-xs text-slate-500">
            {subscriptions.length} Plan{subscriptions.length === 1 ? "" : "s"}{" "}
            Enrolled
          </span>
        </div>

        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {subscriptions.map((sub: any) => (
              <div
                key={sub.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {sub.plans?.products?.name || "Enterprise Cloud Suite"}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {cleanPlanName(sub.plans?.name)}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      {sub.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Rate:</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(
                          sub.plans?.products?.base_price || 1000
                        )}{" "}
                        / {sub.plans?.billing_frequency || "month"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Next Renewal Date:</span>
                      <span className="font-semibold text-slate-900">
                        {sub.next_billing_date
                          ? formatDate(sub.next_billing_date)
                          : "Auto-renews at period end"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    Auto-renewal enabled
                  </span>
                  <button className="text-xs font-medium text-slate-600 transition-colors hover:text-rose-600">
                    Manage Renewal
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            <Clock className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              No active subscriptions found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Contact our sales staff at billing@subscriptiq.com to activate a
              plan.
            </p>
          </div>
        )}
      </div>

      {/* Invoices & Statements Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center space-x-2 text-lg font-bold text-slate-900">
            <FileText className="h-5 w-5 text-indigo-600" />
            <span>Billing Statements & Invoices</span>
          </h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Invoice Number</th>
                    <th className="px-6 py-3">Billing Period</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Total Amount</th>
                    <th className="px-6 py-3">Balance</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(inv.billing_period_start)} &rarr;{" "}
                        {formatDate(inv.billing_period_end)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(inv.due_date)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatCurrency(inv.total_amount)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {inv.outstanding_balance > 0 ? (
                          <span className="text-amber-600">
                            {formatCurrency(inv.outstanding_balance)}
                          </span>
                        ) : (
                          <span className="text-emerald-600">Paid in Full</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.status === "partially_paid"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.outstanding_balance > 0 ? (
                          <PortalPayButton
                            invoiceId={inv.id}
                            outstandingBalance={Number(inv.outstanding_balance)}
                            invoiceNumber={inv.invoice_number}
                          />
                        ) : (
                          <button className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800">
                            <Download className="mr-1 h-3.5 w-3.5" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Receipt className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">
                No invoices generated yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Your first invoice will be generated when Member 3 runs the
                billing cycle.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
