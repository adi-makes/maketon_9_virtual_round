# Member 3 — Billing, Invoicing & Payments

**Owner:** Member 3 (Financial & Invoicing Engine Lead)  
**Assigned Git Branch:** `feat/billing`  
**Primary Focus:** Automated recurring billing cycle runs, tax and discount math, duplicate billing prevention, and payment recording.

---

## 1. Assigned Responsibilities
- Implement automated billing cycle engine in `src/lib/billing/generator.ts`.
- Maintain monetary calculation conventions in `src/lib/billing/calculator.ts`:
  - 18% standard GST calculation.
  - Discount deductions (percentage and fixed).
  - Two-decimal precision using `NUMERIC(12,2)` (no floating point errors).
- Implement **Duplicate Billing Protection**:
  - Check existing invoices before creating a new one for the same period.
  - Rely on DB constraint: `UNIQUE(subscription_id, billing_period_start, billing_period_end)`.
- Implement payment recording in `src/actions/payments.ts`:
  - Deduct recorded payment from `outstanding_balance`.
  - Automatically update invoice status (`paid` vs `partially_paid`).
- Expose the manual "Run Billing Cycle Now" button on `/dashboard` and API endpoint `/api/billing/run`.

---

## 2. Files Primarily Owned
- `src/lib/billing/calculator.ts`
- `src/lib/billing/generator.ts`
- `src/actions/payments.ts`
- `src/app/(dashboard)/invoices/*`
- `src/app/(dashboard)/payments/*`
- `src/app/api/billing/run/route.ts`

---

## 3. Files Shared with Other Members
- `src/types/index.ts` (`Invoice`, `InvoiceItem`, `Payment`, `BillingRunResult`)
- `src/types/database.ts`
- `src/lib/supabase/server.ts`

---

## 4. Dependencies on Other Modules
- **Member 2 (Subscriptions)**: Invoicing engine depends on `subscriptions` having `status = 'active'` and valid `next_billing_date`.
- **Member 4 (Database)**: Relies on `invoices` and `payments` tables with unique constraint.

---

## 5. Required Inputs and Expected Outputs
- **Input**: Active subscriptions due for billing, payment amount and method (`manual_entry`, `stripe`, `bank_transfer`).
- **Output**: Newly generated invoice rows, line items, updated subscription next billing dates, and payment audit logs.

---

## 6. Acceptance Criteria
- [ ] Invoicing engine discovers all active due subscriptions and generates corresponding invoices.
- [ ] Clicking "Run Billing Cycle" a second time produces 0 duplicates (reported as duplicate prevented).
- [ ] Taxes (18%) and discounts are calculated strictly with two-decimal precision.
- [ ] Recording a payment decreases outstanding balance and updates invoice status appropriately.

---

## 7. Integration Checklist
- [ ] Connect "Run Billing Cycle" UI button on `/dashboard` to `runBillingCycle()`.
- [ ] Verify invoices table reflects newly generated invoices instantly.

---

## 8. Testing Checklist
- [ ] Unit test `calculateInvoiceTotals` in `tests/unit/calculator.test.ts`.
- [ ] Trigger two consecutive billing runs to verify duplicate avoidance.

---

## 9. Known Limitations
- Payment gateways (Stripe/Razorpay) are simulated via `manual_entry` and structured references for the hackathon demo.
