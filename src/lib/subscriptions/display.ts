export interface SubscriptionLineItem {
  title: string;
  detail: string;
  icon: "users" | "cloud" | "tam" | "shield";
}

export interface SubscriptionInvoiceRecord {
  invoice_no: string;
  method: string;
  date: string;
  amount: string;
  paid: boolean;
}

export interface SubscriptionDisplayItem {
  id: string;
  code: string;
  customer_id: string;
  customer_name: string;
  customer_company: string;
  customer_contact: string;
  customer_initials: string;
  billing_account_id: string;
  plan_id: string;
  plan_name: string;
  plan_tier_label: string;
  billing_cycle: "Monthly" | "Yearly" | "Daily" | "Weekly" | "Multi-Year";
  timeline_next: string;
  timeline_from: string;
  amount: number;
  amount_formatted: string;
  amount_cadence: string;
  status:
    | "active"
    | "trial"
    | "confirmed"
    | "quotation"
    | "draft"
    | "paused"
    | "closed";
  mandate_bank: string;
  mandate_last4: string;
  mandate_type: string;
  mandate_verified: boolean;
  line_items: SubscriptionLineItem[];
  recent_invoices: SubscriptionInvoiceRecord[];
  auto_renew: boolean;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string | Date): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const PLAN_TAG_REGEX = /\[PLAN_CFG:(\{.*?\})\]$/;

export function cleanPlanName(name?: string | null): string {
  if (!name) return "Standard Plan";
  return name.replace(PLAN_TAG_REGEX, "").trim() || "Standard Plan";
}

/**
 * Maps raw database subscription record with relations into typed SubscriptionDisplayItem.
 */
export function formatSubscriptionDisplay(sub: Record<string, any>): SubscriptionDisplayItem {
  const customer = Array.isArray(sub.customer) ? sub.customer[0] : sub.customer;
  const rawPlan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan;
  const rawProduct = rawPlan?.product
    ? Array.isArray(rawPlan.product)
      ? rawPlan.product[0]
      : rawPlan.product
    : null;
  const items = (sub.items || []) as Array<Record<string, any>>;
  const invoices = (sub.invoices || []) as Array<Record<string, any>>;

  const customerName = customer?.name || "Unknown Customer";
  const customerCompany = customer?.company_name || customerName;
  const customerContact = customer?.phone
    ? `${customerName} (${customer.phone})`
    : customer?.email
    ? `${customerName} (${customer.email})`
    : customerName;

  const initialsSource = (customer?.company_name || customerName || "CU").trim();
  const words = initialsSource.split(/\s+/).filter(Boolean);
  const customerInitials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : initialsSource.slice(0, 2).toUpperCase();

  const planName = cleanPlanName(rawPlan?.name);
  const frequency = (rawPlan?.billing_frequency || "monthly").toLowerCase();

  const billingCycle: SubscriptionDisplayItem["billing_cycle"] =
    frequency === "yearly"
      ? "Yearly"
      : frequency === "daily"
      ? "Daily"
      : frequency === "weekly"
      ? "Weekly"
      : "Monthly";

  const amountCadence =
    frequency === "yearly"
      ? "per year"
      : frequency === "monthly"
      ? "per month"
      : frequency === "weekly"
      ? "per week"
      : frequency === "daily"
      ? "per day"
      : "per cycle";

  let totalAmount = 0;
  if (items.length > 0) {
    totalAmount = items.reduce(
      (sum, it) => sum + (Number(it.unit_price) || 0) * (Number(it.quantity) || 1),
      0
    );
  } else if (rawProduct?.base_price) {
    totalAmount = Number(rawProduct.base_price) || 0;
  }

  let tierLabel = "";
  if (items.length > 0) {
    tierLabel = items
      .map((it) => {
        const v = Array.isArray(it.variant) ? it.variant[0] : it.variant;
        const name = v?.name || rawProduct?.name || "Seat";
        return `${it.quantity} × ${name}`;
      })
      .join(", ");
  } else {
    tierLabel = rawProduct?.name ? `${rawProduct.name} Tier` : `${billingCycle} Tier`;
  }

  const nextDate = sub.next_billing_date || sub.current_period_end;
  let timelineNext = "Not scheduled";
  if (sub.status === "paused") {
    timelineNext = "Paused";
  } else if (sub.status === "closed") {
    timelineNext = "Closed";
  } else if (sub.status === "draft" || sub.status === "quotation") {
    timelineNext = "Pending Activation";
  } else if (nextDate) {
    timelineNext = formatDate(nextDate);
  }

  const fromDate = sub.current_period_start || sub.start_date || sub.created_at;
  const timelineFrom = fromDate ? formatDate(fromDate) : "—";

  const lineItems: SubscriptionLineItem[] =
    items.length > 0
      ? items.map((it, idx) => {
          const v = Array.isArray(it.variant) ? it.variant[0] : it.variant;
          const title =
            v?.name ||
            (items.length === 1 && rawProduct?.name
              ? rawProduct.name
              : `Service Line ${idx + 1}`);
          const qty = Number(it.quantity) || 1;
          const up = Number(it.unit_price) || 0;
          const iconType: SubscriptionLineItem["icon"] =
            title.toLowerCase().includes("cloud") ||
            title.toLowerCase().includes("storage")
              ? "cloud"
              : title.toLowerCase().includes("tam") ||
                title.toLowerCase().includes("support")
              ? "tam"
              : title.toLowerCase().includes("security") ||
                title.toLowerCase().includes("shield")
              ? "shield"
              : "users";
          return {
            title,
            detail: `${qty} × ${formatCurrency(up)}`,
            icon: iconType,
          };
        })
      : [
          {
            title: rawProduct?.name || planName,
            detail: `1 × ${formatCurrency(totalAmount)}`,
            icon: "cloud" as const,
          },
        ];

  const recentInvoices: SubscriptionInvoiceRecord[] = invoices.map((inv) => ({
    invoice_no: inv.invoice_number || `INV-${inv.id.slice(0, 6)}`,
    method: "Invoice",
    date: formatDate(inv.created_at || new Date()),
    amount: formatCurrency(Number(inv.total_amount) || 0),
    paid: inv.status === "paid",
  }));

  const code = `SUB-${sub.id.slice(0, 8).toUpperCase()}`;

  const address = customer?.billing_address as Record<string, unknown> | null;
  const mandateBank =
    (typeof address?.bank_name === "string" ? address.bank_name : null) ||
    "HDFC Bank e-Mandate";

  return {
    id: sub.id,
    code,
    customer_id: sub.customer_id,
    customer_name: customerName,
    customer_company: customerCompany,
    customer_contact: customerContact,
    customer_initials: customerInitials,
    billing_account_id: `AC-${sub.customer_id ? sub.customer_id.slice(0, 4).toUpperCase() : "0000"}`,
    plan_id: sub.plan_id,
    plan_name: planName,
    plan_tier_label: tierLabel,
    billing_cycle: billingCycle,
    timeline_next: timelineNext,
    timeline_from: timelineFrom,
    amount: totalAmount,
    amount_formatted: formatCurrency(totalAmount),
    amount_cadence: amountCadence,
    status: sub.status as SubscriptionDisplayItem["status"],
    mandate_bank: mandateBank,
    mandate_last4: sub.id.slice(-4).toUpperCase(),
    mandate_type: "NACH Autopay",
    mandate_verified: sub.status === "active" || sub.status === "confirmed",
    line_items: lineItems,
    recent_invoices: recentInvoices,
    auto_renew: !sub.cancel_at_period_end,
  };
}
