# SubscriptIQ — Shared Types & Contracts

This directory contains the central TypeScript definitions used across the entire application.

---

## 📁 Files

- [`database.ts`](file:///c:/Developments/subscriptiq/src/types/database.ts): Database schema types mapping all 12 Supabase PostgreSQL tables (`profiles`, `customers`, `products`, `product_variants`, `plans`, `subscriptions`, `subscription_items`, `invoices`, `invoice_items`, `payments`, `discounts`, `tax_rules`).
- [`index.ts`](file:///c:/Developments/subscriptiq/src/types/index.ts): Frontend domain models, status unions (`SubscriptionStatus`, `InvoiceStatus`), and API response wrappers (`ActionResponse<T>`, `DashboardMetrics`).

---

## 🔄 Difference Between Database Types & Domain Models

1. **Database Types (`database.ts`)**:
   - Matches raw SQL column names in `snake_case` (e.g. `billing_period_start`, `unit_price`, `outstanding_balance`).
   - Represents physical rows inserted into or returned by Supabase queries.
   - Can be automatically regenerated with:
     ```bash
     npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
     ```

2. **Domain Models (`index.ts`)**:
   - Written in idiomatic TypeScript `camelCase` for UI forms, client hooks, and calculations.
   - Represents enriched business objects with joined relations (e.g. `invoice.items`, `subscription.plan`).

---

## 🤝 Team Ownership & Usage

- **Member 1 (Dashboard)**: Imports `DashboardMetrics`, `Subscription`, `Invoice` from `@/types`.
- **Member 2 (Subscriptions & Products)**: Uses `Product`, `Plan`, `Subscription`, `SubscriptionStatus`.
- **Member 3 (Billing & Payments)**: Uses `Invoice`, `InvoiceItem`, `Payment`, `InvoiceStatus`.
- **Member 4 (Auth & DB)**: Maintains `database.ts` when schema migrations are updated.
