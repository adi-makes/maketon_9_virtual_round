/**
 * Application constants for SubscriptIQ.
 */

export const APP_CONFIG = {
  name: "SubscriptIQ",
  company: "SubscriptIQ",
  description: "Subscription & Revenue Lifecycle Management System",
  currency: {
    code: "INR",
    symbol: "₹",
  },
  tax: {
    defaultRatePercent: 18.0,
    name: "GST (18%)",
  },
  billing: {
    invoiceDueDays: 15,
  },
  routes: {
    home: "/",
    login: "/login",
    dashboard: "/dashboard",
    products: "/products",
    plans: "/plans",
    subscriptions: "/subscriptions",
    invoices: "/invoices",
    payments: "/payments",
    customers: "/customers",
    portal: "/portal",
  },
} as const;
