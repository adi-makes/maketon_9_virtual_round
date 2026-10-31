# SubscriptIQ — Coding Conventions & Standards

This document specifies the TypeScript, React, styling, and database naming conventions enforced across the SubscriptIQ repository.

---

## 📐 Naming Conventions

| Entity | Convention | Example |
| :--- | :--- | :--- |
| **React Components** | `PascalCase` | `DashboardMetricCard.tsx`, `SubscriptionTable` |
| **Files & Folders** | `kebab-case` | `check-env.mjs`, `database-schema.md` |
| **Variables & Functions** | `camelCase` | `calculateInvoiceTotals()`, `subscriptionStatus` |
| **Constants & Config** | `UPPER_SNAKE_CASE` | `DEFAULT_TAX_RATE`, `APP_CONFIG` |
| **Database Tables & Columns** | `snake_case` | `subscription_items`, `billing_period_start` |
| **TypeScript Types & Interfaces** | `PascalCase` | `Subscription`, `InvoiceStatus`, `Database` |

---

## 🛠️ TypeScript Standards

1. **Strict Type Checking**: `"strict": true` is enforced in `tsconfig.json`.
2. **No `any`**: Avoid `any` unless strictly interfacing with dynamic third-party payloads. Use `unknown` and narrow types.
3. **Domain Types vs Database Types**:
   - Use `src/types/database.ts` for raw SQL query results (`snake_case`).
   - Use `src/types/index.ts` for clean UI component props and business logic (`camelCase`).

---

## ⚛️ React & Next.js Guidelines

1. **Server Components by Default**:
   - Write Server Components whenever possible for faster loading, zero client bundle weight, and direct server data access.
   - Use `"use client"` only for components with interactive hooks (`useState`, `useEffect`, event listeners).
2. **Server Actions for Mutations**:
   - Every mutation file begins with `"use server";`.
   - Always return typed envelopes (`ActionResponse<T>`).
3. **Styling with Tailwind CSS**:
   - Use standard Tailwind utility classes.
   - Combine dynamic class names with `cn(...)` from `@/lib/utils`.

---

## 🧹 Code Formatting & Linting

Run automated checks before committing:
```bash
# Format code across the repo
npm run format

# Verify formatting without modifying files
npm run format:check

# Run TypeScript compile validation
npm run typecheck
```
