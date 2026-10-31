# Member 1 — Dashboard & Frontend Shell

**Owner:** Member 1 (Lead UI & Analytics Engineer)  
**Assigned Git Branch:** `feat/dashboard`  
**Primary Focus:** Application shell layout, executive metrics dashboard, Recharts revenue visualizations, and reusable UI consistency.

---

## 1. Assigned Responsibilities
- Maintain the unified admin/staff navigation shell (`sidebar`, `header`, responsive mobile drawer).
- Build the Executive Analytics Dashboard displaying:
  - Monthly Recurring Revenue (MRR).
  - Active Subscriptions Count.
  - Total Collected Revenue.
  - Outstanding Payments & Overdue Invoices.
- Implement monthly revenue and cash collection charts using **Recharts**.
- Maintain shared UI component library standards (`src/components/ui/`, `src/components/layout/`).

---

## 2. Files Primarily Owned
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/dashboard/*`
- `src/components/layout/*`
- `src/components/ui/*` (shadcn components)

---

## 3. Files Shared with Other Members
- `src/types/index.ts` (Uses `DashboardMetrics`, `Subscription`, `Invoice`)
- `src/lib/utils.ts` (Uses `cn()`, `formatCurrency()`, `formatDate()`)
- `src/app/globals.css` (Tailwind design tokens)

---

## 4. Dependencies on Other Modules
- **Member 2 (Subscriptions)**: Needs count of active subscriptions to calculate MRR.
- **Member 3 (Billing & Payments)**: Needs total invoice amounts, paid amounts, and unpaid invoices.
- **Member 4 (Auth)**: Needs active user profile to display current user name/role in the header.

---

## 5. Required Inputs and Expected Outputs
- **Input**: Database query aggregates on `subscriptions` and `invoices`.
- **Output**: Rendered interactive dashboard with 4 metric cards and 1 Recharts revenue timeline.

---

## 6. Acceptance Criteria
- [ ] Dashboard displays accurate calculated MRR from active subscriptions.
- [ ] Outstanding balance card accurately reflects `total_amount - paid_amount` across confirmed invoices.
- [ ] Navigation sidebar highlights active route (`/dashboard`, `/subscriptions`, `/invoices`, etc.).
- [ ] Charts scale responsively from desktop down to tablet/mobile viewports.

---

## 7. Integration Checklist
- [ ] Connect metric cards to live Supabase queries via `src/lib/supabase/server.ts`.
- [ ] Verify that formatting uses `formatCurrency()` (e.g. `₹7,500.00`).
- [ ] Confirm no hardcoded dummy data remains in final demo view.

---

## 8. Testing Checklist
- [ ] Run `npm run typecheck` to verify all props conform to `src/types`.
- [ ] Verify zero console hydration warnings on `/dashboard`.

---

## 9. Known Limitations
- Initial dashboard displays calculated aggregates; real-time push updates can be enabled via Supabase Realtime in phase 2 if time permits.
