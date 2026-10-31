# SubscriptIQ — Team Responsibilities & Module Ownership

This document details the exact responsibilities, code ownership, dependencies, and integration interfaces for each of the 4 team members.

---

## 👥 Member 1: Dashboard, Analytics & Shell UI

- **Branch**: `feat/dashboard`
- **Ownership**:
  - `src/app/(dashboard)/layout.tsx` (Sidebar navigation and top header)
  - `src/app/(dashboard)/dashboard/page.tsx` (Analytics metrics & charts)
  - `src/components/dashboard/*` (Recharts timeline, metric widgets)
  - `src/components/ui/*` (shadcn design system consistency)
- **Shared Contracts**:
  - Consumes `DashboardMetrics` from `src/types/index.ts`.
  - Consumes `runBillingCycle` action for the manual trigger button.

---

## 👥 Member 2: Products, Plans & Subscription Lifecycles

- **Branch**: `feat/subscriptions`
- **Ownership**:
  - `src/app/(dashboard)/products/*` (Product catalog and variant pricing)
  - `src/app/(dashboard)/plans/*` (Billing frequencies)
  - `src/app/(dashboard)/subscriptions/*` (Subscription creation and transitions)
  - `src/actions/subscriptions.ts` (State machine transition guard)
- **Shared Contracts**:
  - Provides active subscriptions and calculated renewal dates to Member 3's billing runner.
  - Consumes `Product`, `Plan`, `Subscription` types.

---

## 👥 Member 3: Billing, Invoicing & Payments

- **Branch**: `feat/billing`
- **Ownership**:
  - `src/lib/billing/calculator.ts` (18% tax and discount calculations)
  - `src/lib/billing/generator.ts` (Automated recurring invoice generator)
  - `src/actions/payments.ts` (Payment recording action)
  - `src/app/(dashboard)/invoices/*` (Invoice list and detail view)
  - `src/app/(dashboard)/payments/*` (Payment transaction list)
  - `src/app/api/billing/run/route.ts` (Billing API webhook)
- **Shared Contracts**:
  - Uses `Invoice`, `Payment`, `BillingRunResult` types.
  - Generates invoice records consumed by Member 1's revenue charts.

---

## 👥 Member 4: Authentication, Database & Customer Portal

- **Branch**: `feat/auth-database`
- **Ownership**:
  - `supabase/migrations/*` (12 PostgreSQL tables and RLS)
  - `supabase/seed.sql` (Initial demo data)
  - `src/lib/supabase/*` (Client factories and middleware session updates)
  - `src/middleware.ts` (Role-based route guard)
  - `src/app/(auth)/*` (Sign-in views)
  - `src/app/(portal)/*` (Customer self-service portal)
  - Vercel deployment coordination
- **Shared Contracts**:
  - Generates `src/types/database.ts` and distributes to all members.
  - Coordinates any schema or column changes.
