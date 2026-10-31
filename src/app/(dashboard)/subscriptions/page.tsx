import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SubscriptionStatus } from "@/types";

export const dynamic = "force-dynamic";

function getStatusBadge(status: SubscriptionStatus) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          Active
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
          Confirmed
        </span>
      );
    case "quotation":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          Quotation
        </span>
      );
    case "draft":
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
          Draft
        </span>
      );
    case "paused":
      return (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
          Paused
        </span>
      );
    case "closed":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
          Closed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
          {status}
        </span>
      );
  }
}

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(`
      id,
      status,
      start_date,
      current_period_start,
      current_period_end,
      next_billing_date,
      cancel_at_period_end,
      customer:customers (
        id,
        name,
        email,
        company_name
      ),
      plan:plans (
        id,
        name,
        billing_frequency,
        interval_count,
        product:products (
          id,
          name,
          base_price
        )
      ),
      items:subscription_items (
        id,
        quantity,
        unit_price,
        variant:product_variants (
          id,
          name,
          price_adjustment
        )
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Subscriptions Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage customer accounts, recurring billing cycles, and lifecycle state transitions.
          </p>
        </div>
        <Link
          href="/subscriptions/new"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
        >
          + Create Subscription
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load subscriptions: {error.message}
        </div>
      )}

      {subscriptions && subscriptions.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 p-12 text-center">
          <h3 className="text-base font-semibold text-slate-800">No subscriptions created yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create your first subscription to begin automated recurring billing.
          </p>
          <div className="mt-6">
            <Link
              href="/subscriptions/new"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
            >
              Create Subscription
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Plan / Product</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Recurring Total</th>
                <th className="px-6 py-3">Next Renewal</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subscriptions?.map((sub) => {
                const customer = sub.customer as unknown as {
                  name: string;
                  email: string;
                  company_name?: string | null;
                } | null;
                const plan = sub.plan as unknown as {
                  name: string;
                  billing_frequency: string;
                  interval_count: number;
                  product?: { name: string };
                } | null;
                const items = (sub.items || []) as unknown as Array<{
                  quantity: number;
                  unit_price: number;
                }>;

                // Total calculated as unit_price * quantity
                const totalAmount = items.reduce(
                  (sum, it) => sum + Number(it.unit_price) * Number(it.quantity),
                  0
                );

                return (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {customer?.name || "Unknown Customer"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {customer?.company_name ? `${customer.company_name} • ` : ""}
                        {customer?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {plan?.product?.name || "Product"}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">
                        {plan?.name} ({plan?.billing_frequency})
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(sub.status as SubscriptionStatus)}
                        {sub.cancel_at_period_end && (
                          <span className="inline-flex rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                            Cancels at end
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {sub.next_billing_date ? (
                        formatDate(sub.next_billing_date)
                      ) : (
                        <span className="text-xs text-slate-400">Not activated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/subscriptions/${sub.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Lifecycle &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

