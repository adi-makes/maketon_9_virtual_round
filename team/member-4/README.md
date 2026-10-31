# Member 4 — Authentication, Database & Integration

**Owner:** Member 4 (Database Architect, Security & DevOps Lead)  
**Assigned Git Branch:** `feat/auth-database`  
**Primary Focus:** Supabase Auth integration, user profiles & roles, database schema migrations, Row-Level Security, Customer Self-Service Portal, and Vercel deployment.

---

## 1. Assigned Responsibilities

- Maintain Supabase PostgreSQL migrations (`supabase/migrations/`).
- Enforce Role-Based Access Control (RBAC):
  - `admin`: Full control over products, plans, staff, subscriptions, reports.
  - `staff`: Operational control over customers, quotations, invoices, payments.
  - `customer`: Restricted to own customer record, invoices, and self-service management.
- Maintain Row-Level Security (RLS) policies on all 12 tables.
- Implement Customer Self-Service Portal (`/portal`):
  - Isolate data so logged-in customer sees only their company's subscriptions and invoices.
- Coordinate team database changes before any schema edits.
- Lead integration testing and Vercel cloud deployment.

---

## 2. Files Primarily Owned

- `supabase/migrations/*`
- `supabase/seed.sql`
- `src/lib/supabase/*`
- `src/middleware.ts`
- `src/app/(auth)/*`
- `src/app/(portal)/*`
- `src/app/auth/callback/route.ts`

---

## 3. Files Shared with Other Members

- `src/types/database.ts` (Member 4 generates and distributes)
- `.env.example`
- `README.md`

---

## 4. Dependencies on Other Modules

- Coordinates with all members to ensure table schema and foreign keys support frontend needs.

---

## 5. Required Inputs and Expected Outputs

- **Input**: User login credentials, Supabase Auth tokens.
- **Output**: Authenticated user session with verified role in metadata, isolated database query results governed by RLS.

---

## 6. Acceptance Criteria

- [ ] Logged-in admin/staff can access `/dashboard` and internal routes.
- [ ] Logged-in customer is redirected away from `/dashboard` directly into `/portal`.
- [ ] Customers executing direct queries can only retrieve their own company records.
- [ ] Seed script executes cleanly in Supabase SQL Editor.

---

## 7. Integration Checklist

- [ ] Verify `src/middleware.ts` correctly blocks unauthenticated requests to `/dashboard`.
- [ ] Verify `npm run check:env` validates all teammates' local configurations.

---

## 8. Testing Checklist

- [ ] Sign in as `admin@subscriptiq.com` &rarr; verify `/dashboard` loads.
- [ ] Sign in as `customer@acme.com` &rarr; verify `/portal` loads and only Acme subscriptions are visible.

---

## 9. Known Limitations

- Password reset emails require an SMTP provider (e.g. Resend) configured in the Supabase Dashboard for live production; demo uses pre-seeded test accounts.
