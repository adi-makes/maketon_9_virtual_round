# SubscriptIQ — System Architecture

This document outlines the architectural principles, layers, data flows, and security model for **SubscriptIQ — Subscription Management System**.

---

## 1. High-Level Architectural Diagram

```
                     ┌─────────────────────────────────────────┐
                     │            Client Web Browser           │
                     └────────────────────┬────────────────────┘
                                          │
                     HTTP / Next.js Routing & SSR Middleware
                                          │
                     ┌────────────────────▼────────────────────┐
                     │          Next.js 14 App Router          │
                     │                                         │
                     │  ├── (auth)      /login, /register      │
                     │  ├── (dashboard) /dashboard, /invoices  │
                     │  ├── (portal)    /portal (Self-service) │
                     │  └── api/        /api/health            │
                     └─────────────┬───────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    Server Components       Server Actions       Route Handlers
     (Read operations)    (Mutations & State)   (Health & Hooks)
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                     ┌─────────────▼───────────────┐
                     │    @supabase/ssr Client     │
                     │  (Session Cookie Transport) │
                     └─────────────┬───────────────┘
                                   │
                    PostgreSQL Connections (TLS)
                                   │
                     ┌─────────────▼───────────────┐
                     │   Supabase Cloud Platform   │
                     │  ├── Supabase Auth (JWT)    │
                     │  ├── Row-Level Security     │
                     │  └── 12 Relational Tables   │
                     └─────────────────────────────┘
```

---

## 2. Layer Responsibilities

### Presentation Layer (`src/app/` & `src/components/`)

- Uses **Next.js App Router** with route groups:
  - `(auth)`: Login and registration views.
  - `(dashboard)`: Internal administrative and staff operational dashboard.
  - `(portal)`: Customer self-service views.
- Styling is implemented via **Tailwind CSS** and **shadcn/ui** components.
- Charts and analytics are powered by **Recharts**.

### Business Logic & Mutation Layer (`src/actions/` & `src/lib/billing/`)

- Pure business math (18% GST tax, discount deductions, line item multiplications) resides in `src/lib/billing/calculator.ts`.
- State mutations execute within Next.js **Server Actions** (`"use server"`).
- Automated recurring billing runs execute through `src/lib/billing/generator.ts`.

### Data Access Layer (`src/lib/supabase/`)

- Two factory patterns prevent connection leaks and ensure authorization:
  - `createBrowserClient` for interactive client-side listeners.
  - `createServerClient` for server components, actions, and routes with cookie management.

### Persistence & Security Layer (`supabase/`)

- PostgreSQL database hosted on Supabase.
- Strict **Row-Level Security (RLS)** guarantees tenant isolation.
- Duplicate billing is intercepted at the database layer via unique constraints.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Resource             |         Admin          |       Staff       |      Customer       |
| :------------------- | :--------------------: | :---------------: | :-----------------: |
| **Products & Plans** | Create / Edit / Delete |     Read Only     |  Read Active Only   |
| **Subscriptions**    |      Full Control      |  Create / Update  |    View Own Only    |
| **Invoices**         |      Full Control      | Generate / Manage | View & Pay Own Only |
| **Payments**         |      Full Control      |  Record Payment   |  View Own Receipts  |
| **System Settings**  |      Full Control      |     No Access     |      No Access      |
