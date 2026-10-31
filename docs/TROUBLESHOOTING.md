# SubscriptIQ — Troubleshooting & Error Recovery Guide

This document provides concrete fixes for common errors encountered during local development and integration.

---

## ⚠️ Common Issues & Solutions

### 1. `Missing Supabase environment variables`

- **Symptom**: Browser or terminal displays error: `NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be defined.`
- **Fix**:
  1. Check if `.env.local` exists in the repository root.
  2. Run `npm run check:env` to validate syntax.
  3. Ensure no trailing quotes or whitespace exist around the keys.
  4. Restart your development server (`npm run dev`).

---

### 2. `Port 3000 is already in use`

- **Symptom**: Next.js automatically starts on port `3001` or fails to bind.
- **Fix**:
  - On Windows: Run `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force` in PowerShell.
  - On Linux/macOS: Run `lsof -ti:3000 | xargs kill -9`.

---

### 3. PostgreSQL `Unique Constraint Violation` on Invoices (Error `23505`)

- **Symptom**: Invoicing engine throws a unique violation during a billing run.
- **Explanation**: This is an intentional safety feature! The database constraint `unique_subscription_billing_period` prevented duplicate billing for the same billing window. The generator catches this code (`23505`) and records it as an avoided duplicate.

---

### 4. Supabase `Infinite Recursion` on RLS Policies

- **Symptom**: Querying `profiles` or `customers` produces an error: `infinite recursion detected in policy for relation ...`.
- **Fix**: Ensure helper functions like `get_auth_role()` are defined with `SECURITY DEFINER` and `STABLE`. Never write a policy on `profiles` that selects from `profiles` without a security definer barrier.

---

### 5. Nested `.env` policy violation

- **Symptom**: `npm run check:env-files` fails with exit code `1`.
- **Fix**: Delete any `.env` or `.env.local` files located in subdirectories (e.g. `src/.env` or `team/member-1/.env`). All environment variables must strictly exist in the root `.env.local`.

---

### 6. TypeScript Compile Errors on Build

- **Symptom**: `npm run typecheck` or `npm run build` fails with type mismatch.
- **Fix**:
  1. Ensure you are importing domain types from `@/types` and not an external removed package.
  2. Verify that all components have typed props.
  3. Run `npm run typecheck` locally before pushing to Git.
