/**
 * SubscriptIQ — Dashboard Financial Metrics Calculation Engine
 * Pure, isolated financial calculation functions for the executive dashboard.
 */

/**
 * Converts a currency value in INR (e.g. 123.45) to integer paise (12345).
 */
export function toPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) {
    throw new TypeError("Monetary value must be a finite number.");
  }
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise back to standard two-decimal precision rupees.
 */
export function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}

export interface MonthlyRevenueStat {
  month: string;           // "YYYY-MM"
  mrr: number;             // Monthly Recurring Revenue
  new_revenue: number;     // Revenue from new subscriptions / invoices
  churned_revenue: number; // Revenue lost from cancellations
  net_revenue: number;     // mrr - churned_revenue / net collected
  active_subscriptions: number;
  new_customers: number;
}

export interface DashboardMetrics {
  totalRevenue: number;              // Net collected cash from completed payments minus refunds (INR)
  grossCollected: number;            // Gross settled amount across all completed payments
  refundedAmount: number;            // Total amount refunded
  invoicedRevenue: number;           // Total of all confirmed and paid invoices issued
  outstandingReceivables: number;    // Total outstanding balance across unpaid, valid invoices
  overdueInvoicesCount: number;      // Count of valid invoices past due date with remaining balance > 0
  activeSubscriptionsCount: number;  // Count of distinct subscriptions in "active" status
  totalCustomersCount: number;       // Total registered customers
  totalSubscriptionsCount: number;   // Total contracts across all lifecycle statuses
  mrr: number;                       // Normalized Monthly Recurring Revenue from eligible active subscriptions
  subscriptionDistribution: {
    active: number;
    confirmed: number;
    paused: number;
    other: number; // draft, closed, quotation
    activePercent: number;
    confirmedPercent: number;
    pausedPercent: number;
    otherPercent: number;
  };
  recentSubscriptions: Array<{
    id: string;
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_initials: string;
    plan_name: string;
    start_date: string;
    next_billing_date: string | null;
    amount: number;
    status: string;
  }>;
  recentSettlements: Array<{
    id: string;
    payment_number: string;
    customer_name: string;
    invoice_number: string;
    amount: number;
    created_at: string;
    status: string;
  }>;
  timeSeriesStats: MonthlyRevenueStat[];
}

/**
 * Normalizes a recurring commitment amount (in paise) to its monthly equivalent
 * based on billing frequency and interval count.
 */
export function normalizeToMonthlyPaise(
  recurringPaise: number,
  frequency: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
  intervalCount: number = 1
): number {
  const count = Math.max(1, intervalCount);
  if (recurringPaise <= 0) return 0;

  switch (frequency) {
    case "daily":
      // Standard annualization: 365 days / 12 months = ~30.4167 days/month
      return Math.round((recurringPaise * 365) / (12 * count));
    case "weekly":
      // Standard annualization: 52 weeks / 12 months = 4.3333 weeks/month
      return Math.round((recurringPaise * 52) / (12 * count));
    case "yearly":
      return Math.round(recurringPaise / (12 * count));
    case "monthly":
    default:
      return Math.round(recurringPaise / count);
  }
}

/**
 * Calculates recurring commitment for a subscription in integer paise.
 */
export function calculateSubscriptionRecurringPaise(sub: {
  plan?: {
    billing_frequency?: "daily" | "weekly" | "monthly" | "yearly";
    interval_count?: number;
    product?: { base_price?: number };
  } | null;
  items?: Array<{ quantity?: number; unit_price?: number }> | null;
}): number {
  const items = sub.items || [];
  if (items.length > 0) {
    let sumPaise = 0;
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPaise = toPaise(Number(item.unit_price) || 0);
      sumPaise += qty * unitPaise;
    }
    return sumPaise;
  }

  const basePrice = Number(sub.plan?.product?.base_price || 0);
  return toPaise(basePrice);
}

/**
 * Pure function: calculates all dashboard metrics from raw dataset arrays.
 */
export function aggregateDashboardMetrics(params: {
  subscriptions: any[];
  invoices: any[];
  payments: any[];
  customersCount: number;
  now?: Date;
}): DashboardMetrics {
  const { subscriptions, invoices, payments, customersCount, now = new Date() } = params;

  // 1. Payments Calculations
  let grossCollectedPaise = 0;
  let refundedPaise = 0;

  for (const pay of payments) {
    const amountPaise = toPaise(Number(pay.amount) || 0);
    if (pay.status === "completed") {
      grossCollectedPaise += amountPaise;
    } else if (pay.status === "refunded") {
      refundedPaise += amountPaise;
    }
  }

  const netRevenuePaise = Math.max(0, grossCollectedPaise - refundedPaise);

  // 2. Invoices Calculations
  let invoicedRevenuePaise = 0;
  let outstandingReceivablesPaise = 0;
  let overdueInvoicesCount = 0;

  for (const inv of invoices) {
    // Exclude draft and cancelled invoices
    if (inv.status === "draft" || inv.status === "cancelled") {
      continue;
    }

    const totalPaise = toPaise(Number(inv.total_amount) || 0);
    const balancePaise = toPaise(Number(inv.outstanding_balance) || 0);

    invoicedRevenuePaise += totalPaise;

    if (balancePaise > 0) {
      outstandingReceivablesPaise += balancePaise;

      // Check if overdue
      if (inv.status !== "paid" && inv.due_date) {
        const dueDate = new Date(inv.due_date);
        if (dueDate.getTime() < now.getTime()) {
          overdueInvoicesCount++;
        }
      }
    }
  }

  // 3. Subscriptions & MRR Calculations
  let mrrPaise = 0;
  let activeSubscriptionsCount = 0;
  let confirmedSubs = 0;
  let pausedSubs = 0;
  let otherSubs = 0;

  for (const sub of subscriptions) {
    const status = sub.status;
    if (status === "active") {
      activeSubscriptionsCount++;

      const recurringPaise = calculateSubscriptionRecurringPaise(sub);
      const frequency = sub.plan?.billing_frequency || "monthly";
      const intervalCount = sub.plan?.interval_count || 1;

      mrrPaise += normalizeToMonthlyPaise(recurringPaise, frequency, intervalCount);
    } else if (status === "confirmed") {
      confirmedSubs++;
    } else if (status === "paused") {
      pausedSubs++;
    } else {
      otherSubs++;
    }
  }

  const totalSubsCount = subscriptions.length;
  const activePercent = totalSubsCount > 0 ? Math.round((activeSubscriptionsCount / totalSubsCount) * 100) : 0;
  const confirmedPercent = totalSubsCount > 0 ? Math.round((confirmedSubs / totalSubsCount) * 100) : 0;
  const pausedPercent = totalSubsCount > 0 ? Math.round((pausedSubs / totalSubsCount) * 100) : 0;
  const otherPercent = totalSubsCount > 0 ? Math.max(0, 100 - activePercent - confirmedPercent - pausedPercent) : 0;

  // 4. Recent Subscriptions (top 5)
  const sortedSubs = [...subscriptions].sort((a, b) => {
    return new Date(b.created_at || b.start_date || 0).getTime() - new Date(a.created_at || a.start_date || 0).getTime();
  });

  const recentSubscriptions = sortedSubs.slice(0, 5).map((sub) => {
    const rawCustomer = Array.isArray(sub.customer) ? sub.customer[0] : sub.customer;
    const rawPlan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan;
    const displayName = rawCustomer?.company_name || rawCustomer?.name || "Customer";
    const initials = displayName
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const recurringPaise = calculateSubscriptionRecurringPaise(sub);

    return {
      id: sub.id,
      customer_id: sub.customer_id,
      customer_name: displayName,
      customer_email: rawCustomer?.email || "billing@client.com",
      customer_initials: initials || "CU",
      plan_name: rawPlan?.name || "Standard Plan",
      start_date: sub.start_date,
      next_billing_date: sub.next_billing_date,
      amount: fromPaise(recurringPaise),
      status: sub.status,
    };
  });

  // 5. Recent Settlements (top 5)
  const sortedPayments = [...payments].sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const recentSettlements = sortedPayments.slice(0, 5).map((pay) => {
    const rawCustomer = Array.isArray(pay.customer) ? pay.customer[0] : pay.customer;
    const rawInvoice = Array.isArray(pay.invoice) ? pay.invoice[0] : pay.invoice;
    const displayName = rawCustomer?.company_name || rawCustomer?.name || "Customer";

    return {
      id: pay.id,
      payment_number: pay.payment_number || `PAY-${pay.id.slice(0, 8)}`,
      customer_name: displayName,
      invoice_number: rawInvoice?.invoice_number || "INV-N/A",
      amount: Number(pay.amount) || 0,
      created_at: pay.created_at,
      status: pay.status,
    };
  });

  // 6. Time Series Trends (last 6 months chronological)
  const timeSeriesStats: MonthlyRevenueStat[] = [];
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  for (let i = 0; i < 6; i++) {
    const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth() + 1;
    const monthKey = `${year}-${String(monthIndex).padStart(2, "0")}`;

    const nextMonthDate = new Date(year, monthIndex, 1);

    // Sum completed payments in this month
    let monthCollectedPaise = 0;
    for (const p of payments) {
      if (p.status === "completed" && p.created_at) {
        const pDate = new Date(p.created_at);
        if (pDate >= d && pDate < nextMonthDate) {
          monthCollectedPaise += toPaise(Number(p.amount) || 0);
        }
      }
    }

    // Sum invoices in this month
    let monthInvoicedPaise = 0;
    for (const inv of invoices) {
      if (inv.status !== "draft" && inv.status !== "cancelled" && inv.created_at) {
        const invDate = new Date(inv.created_at);
        if (invDate >= d && invDate < nextMonthDate) {
          monthInvoicedPaise += toPaise(Number(inv.total_amount) || 0);
        }
      }
    }

    // Active subscriptions active by this month
    let activeInMonth = 0;
    let mrrInMonthPaise = 0;
    for (const sub of subscriptions) {
      const created = new Date(sub.created_at || sub.start_date || 0);
      if (created < nextMonthDate && sub.status === "active") {
        activeInMonth++;
        const recurringPaise = calculateSubscriptionRecurringPaise(sub);
        const freq = sub.plan?.billing_frequency || "monthly";
        const interval = sub.plan?.interval_count || 1;
        mrrInMonthPaise += normalizeToMonthlyPaise(recurringPaise, freq, interval);
      }
    }

    timeSeriesStats.push({
      month: monthKey,
      mrr: fromPaise(mrrInMonthPaise),
      new_revenue: fromPaise(monthInvoicedPaise),
      churned_revenue: 0,
      net_revenue: fromPaise(monthCollectedPaise),
      active_subscriptions: activeInMonth,
      new_customers: Math.min(activeInMonth, 1),
    });
  }

  return {
    totalRevenue: fromPaise(netRevenuePaise),
    grossCollected: fromPaise(grossCollectedPaise),
    refundedAmount: fromPaise(refundedPaise),
    invoicedRevenue: fromPaise(invoicedRevenuePaise),
    outstandingReceivables: fromPaise(outstandingReceivablesPaise),
    overdueInvoicesCount,
    activeSubscriptionsCount,
    totalCustomersCount: customersCount,
    totalSubscriptionsCount: totalSubsCount,
    mrr: fromPaise(mrrPaise),
    subscriptionDistribution: {
      active: activeSubscriptionsCount,
      confirmed: confirmedSubs,
      paused: pausedSubs,
      other: otherSubs,
      activePercent,
      confirmedPercent,
      pausedPercent,
      otherPercent,
    },
    recentSubscriptions,
    recentSettlements,
    timeSeriesStats,
  };
}
