import type { Database } from "@/types/database";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
export type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

export interface CustomerBillingAddress {
  line1?: string;
  street?: string;
  city?: string;
  state?: string | null;
  postal_code?: string;
  country?: string;
  bank_name?: string;
}

export interface CustomerInvoiceSummary {
  id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface CustomerSubscriptionSummary {
  id: string;
  status: string;
  start_date: string;
  next_billing_date: string | null;
  plan_name: string;
  billing_frequency: string;
  amount: number;
}

export interface CustomerDetailRecord {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  billing_address: CustomerBillingAddress;
  initials: string;
  colorClass: string;
  legalEntity: string;
  gstin: string;
  pan: string;
  residency: string;
  status: "active" | "at_risk" | "trial" | "onboarding";
  tierName: string;
  tierSla: string;
  renewal: string;
  pocRole: string;
  mrr: number;
  ltv: number;
  overdue: number;
  overdueInvoiceRef?: string;
  overdueDays?: number;
  activeSubscriptionsCount: number;
  totalSubscriptionsCount: number;
  totalInvoicesCount: number;
  subscriptions: CustomerSubscriptionSummary[];
  invoices: CustomerInvoiceSummary[];
}

export interface CustomerDirectoryMetrics {
  totalCustomers: number;
  activeCustomers: number;
  newThisMonth: number;
  outstandingArRiskAccounts: number;
  totalArRiskAmount: number;
}
