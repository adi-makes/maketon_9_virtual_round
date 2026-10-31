import type { CustomerRow, CustomerDetailRecord, CustomerBillingAddress, CustomerDirectoryMetrics } from "./types";
import { parsePlan } from "@/lib/plans/config";

// Palette generator for initials avatar
const COLOR_CLASSES = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-700",
  "bg-orange-100 text-orange-800",
  "bg-purple-100 text-purple-800",
  "bg-rose-100 text-rose-800",
  "bg-blue-100 text-blue-800",
  "bg-amber-100 text-amber-800",
];

export function parseCustomerAddress(raw: unknown): CustomerBillingAddress {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { line1: "JP Nagar 4th Phase", city: "Bengaluru", state: "KA", country: "India" };
  }
  const addr = raw as Record<string, unknown>;
  return {
    line1: (addr.line1 as string) || (addr.street as string) || "JP Nagar 4th Phase",
    street: (addr.street as string) || (addr.line1 as string),
    city: (addr.city as string) || "Bengaluru",
    state: (addr.state as string) || "KA",
    postal_code: (addr.postal_code as string) || "560078",
    country: (addr.country as string) || "India",
    bank_name: (addr.bank_name as string) || undefined,
  };
}

export function generateCustomerInitials(companyName?: string | null, name?: string | null): string {
  const source = (companyName || name || "CU").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/**
 * Transforms raw customer DB record along with joined subscriptions and invoices
 * into a full CustomerDetailRecord.
 */
export function buildCustomerDetailRecord(
  customer: CustomerRow,
  rawSubs: Array<Record<string, any>> = [],
  rawInvs: Array<Record<string, any>> = []
): CustomerDetailRecord {
  const address = parseCustomerAddress(customer.billing_address);
  const initials = generateCustomerInitials(customer.company_name, customer.name);

  // Pick stable avatar color based on id characters
  const charCodeSum = customer.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colorClass = COLOR_CLASSES[charCodeSum % COLOR_CLASSES.length];

  // Process subscriptions
  let mrrPaise = 0;
  let activeSubsCount = 0;

  const subscriptions = rawSubs.map((sub) => {
    const rawPlan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan || sub.plans;
    const planConfig = rawPlan ? parsePlan(rawPlan as Parameters<typeof parsePlan>[0]) : null;
    const rawProduct = rawPlan?.product
      ? Array.isArray(rawPlan.product)
        ? rawPlan.product[0]
        : rawPlan.product
      : rawPlan?.products
      ? Array.isArray(rawPlan.products)
        ? rawPlan.products[0]
        : rawPlan.products
      : null;

    const items = (sub.items || sub.subscription_items || []) as Array<Record<string, any>>;
    let subAmount = 0;
    if (items.length > 0) {
      subAmount = items.reduce(
        (sum, it) => sum + (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
        0
      );
    } else if (rawProduct?.base_price) {
      subAmount = Number(rawProduct.base_price) || 0;
    }

    const frequency = (planConfig?.billingFrequency || rawPlan?.billing_frequency || "monthly").toLowerCase();
    const intervalCount = Math.max(1, planConfig?.intervalCount || rawPlan?.interval_count || 1);

    if (sub.status === "active") {
      activeSubsCount++;
      let normalizedMonthly = subAmount;
      if (frequency === "yearly") {
        normalizedMonthly = subAmount / (12 * intervalCount);
      } else if (frequency === "weekly") {
        normalizedMonthly = (subAmount * 52) / (12 * intervalCount);
      } else if (frequency === "daily") {
        normalizedMonthly = (subAmount * 365) / (12 * intervalCount);
      } else {
        normalizedMonthly = subAmount / intervalCount;
      }
      mrrPaise += Math.round(normalizedMonthly * 100);
    }

    return {
      id: sub.id,
      status: sub.status,
      start_date: sub.start_date,
      next_billing_date: sub.next_billing_date || null,
      plan_name: planConfig?.cleanName || rawPlan?.name || "Standard Plan",
      billing_frequency: frequency,
      amount: subAmount,
    };
  });

  // Process invoices
  let ltvPaise = 0;
  let overduePaise = 0;
  let latestOverdueInvoiceNumber: string | undefined;
  let maxOverdueDays = 0;
  const now = new Date();

  const invoices = rawInvs.map((inv) => {
    const totalAmount = Number(inv.total_amount) || 0;
    const paidAmount = Number(inv.paid_amount) || 0;
    const balance = Number(inv.outstanding_balance) ?? Math.max(0, totalAmount - paidAmount);

    ltvPaise += Math.round(paidAmount * 100);

    const isOverdue =
      balance > 0 &&
      inv.status !== "paid" &&
      inv.status !== "cancelled" &&
      inv.due_date &&
      new Date(inv.due_date) < now;

    if (isOverdue) {
      overduePaise += Math.round(balance * 100);
      if (!latestOverdueInvoiceNumber) {
        latestOverdueInvoiceNumber = inv.invoice_number;
      }
      const days = Math.max(0, Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)));
      if (days > maxOverdueDays) {
        maxOverdueDays = days;
      }
    }

    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      outstanding_balance: balance,
      status: inv.status,
      due_date: inv.due_date,
      created_at: inv.created_at,
    };
  });

  // Derive status
  let status: CustomerDetailRecord["status"] = "onboarding";
  if (overduePaise > 0) {
    status = "at_risk";
  } else if (activeSubsCount > 0) {
    status = "active";
  } else if (subscriptions.some((s) => s.status === "trial")) {
    status = "trial";
  } else if (subscriptions.length > 0) {
    status = "active";
  }

  // Derive mock GST/PAN/Compliance if not in billing_address
  const gstin =
    (customer.billing_address as Record<string, any>)?.gstin ||
    `29AAACX${customer.id.replace(/-/g, "").slice(0, 4).toUpperCase()}1Z0`;
  const pan =
    (customer.billing_address as Record<string, any>)?.pan ||
    gstin.slice(2, 12);
  const residency = address.state
    ? `${address.state}, ${address.country || "India"}`
    : `${address.city || "Karnataka"}, India`;

  const primaryPlan = subscriptions[0];
  const tierName = primaryPlan ? primaryPlan.plan_name : "Standard Plan";

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    company_name: customer.company_name,
    phone: customer.phone,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
    billing_address: address,
    initials,
    colorClass,
    legalEntity: customer.company_name || `${customer.name} Enterprise`,
    gstin,
    pan,
    residency,
    status,
    tierName,
    tierSla: "99.95% High Availability SLA",
    renewal: primaryPlan?.next_billing_date
      ? `Renews ${new Date(primaryPlan.next_billing_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
      : "Renews on active cycle",
    pocRole: "FinOps & Billing Lead",
    mrr: Math.round(mrrPaise / 100),
    ltv: Math.round(ltvPaise / 100),
    overdue: Math.round(overduePaise / 100),
    overdueInvoiceRef: latestOverdueInvoiceNumber,
    overdueDays: maxOverdueDays > 0 ? maxOverdueDays : undefined,
    activeSubscriptionsCount: activeSubsCount,
    totalSubscriptionsCount: subscriptions.length,
    totalInvoicesCount: invoices.length,
    subscriptions,
    invoices,
  };
}

export function computeCustomerDirectoryMetrics(customers: CustomerDetailRecord[]): CustomerDirectoryMetrics {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = customers.filter((c) => new Date(c.created_at) >= startOfMonth).length;

  const atRiskList = customers.filter((c) => c.overdue > 0 || c.status === "at_risk");
  const outstandingArRiskAccounts = atRiskList.length;
  const totalArRiskAmount = atRiskList.reduce((sum, c) => sum + c.overdue, 0);

  return {
    totalCustomers,
    activeCustomers,
    newThisMonth,
    outstandingArRiskAccounts,
    totalArRiskAmount,
  };
}
