/**
 * Core Application Domain Models and Shared Contracts for SubscriptIQ.
 * Used across frontend components, server actions, and API routes.
 */

export type UserRole = "admin" | "staff" | "customer";

export type SubscriptionStatus =
  "draft" | "quotation" | "confirmed" | "active" | "paused" | "closed";

export type InvoiceStatus =
  "draft" | "confirmed" | "partially_paid" | "paid" | "cancelled";

export type PaymentMethod =
  "manual_entry" | "bank_transfer" | "stripe" | "razorpay";

export type BillingFrequency = "monthly" | "yearly";

export interface Customer {
  id: string;
  name: string;
  email: string;
  companyName?: string | null;
  phone?: string | null;
  billingAddress?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  priceAdjustment: number;
  sku?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  isActive: boolean;
  variants?: ProductVariant[];
}

export interface Plan {
  id: string;
  productId: string;
  name: string;
  billingFrequency: BillingFrequency;
  intervalCount: number;
  isActive: boolean;
  product?: Product;
}

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  variant?: ProductVariant | null;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  nextBillingDate?: string | null;
  cancelAtPeriodEnd: boolean;
  customer?: Customer;
  plan?: Plan;
  items?: SubscriptionItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  customerId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  status: InvoiceStatus;
  items?: InvoiceItem[];
  customer?: Customer;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
}

export interface DashboardMetrics {
  mrr: number;
  activeSubscriptionsCount: number;
  totalRevenueCollected: number;
  outstandingBalanceTotal: number;
  overdueInvoicesCount: number;
}

export interface BillingRunResult {
  invoicesCreated: number;
  duplicatesAvoided: number;
  failuresCount: number;
  details: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
