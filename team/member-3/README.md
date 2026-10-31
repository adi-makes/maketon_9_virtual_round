# Member 3 — Billing, Invoicing & Payments Engine

**Owner:** Member 3 (Financial Systems Engineer, TypeScript Architect, PostgreSQL Engineer)  
**Primary Module:** Automated recurring billing cycles, monetary calculation engine, duplicate billing prevention, invoice management, and payment reconciliation.  
**Branch:** `main` (integrated) / `feat/billing`

---

## 1. Module Responsibilities

1. **Monetary Calculation Engine**: Authoritative decimal/paise arithmetic eliminating floating-point rounding drift.
2. **Automated Recurring Invoicing**: Scheduled and on-demand discovery of due active subscriptions, generating period invoices and advancing renewal dates.
3. **Duplicate Billing Prevention**: Strong database-level and query-level idempotency guards using `UNIQUE(subscription_id, billing_period_start, billing_period_end)`.
4. **GST & Tax Compliance**: Configurable tax rules (standard GST 18% = CGST 9% + SGST 9%) snapshotting rates onto issued invoices.
5. **Discount Engine**: Percentage and fixed-amount discounts with eligibility verification and subtotal caps.
6. **Payment Recording & Reconciliation**: Multi-step partial payments, overpayment rejection, and balance reconciliation.
7. **Invoice Management UI**: Real-time `/invoices` ledger with KPI cards, dual-pane inspector, and `/invoices/[id]` detail view.
8. **Payment Operations UI**: `/payments` transaction journal with offline payment recording modal.
9. **API & Dashboard Integration**: Webhook `/api/billing/run` and executive dashboard manual trigger button.

---

## 2. Implemented Features

- [x] **Precision Financial Engine (`calculations.ts` / `calculator.ts`)**:
  - Integer paise scaling (`toPaise` / `toRupees`).
  - Unit price * quantity line extensions.
  - Percentage & fixed discounts with caps.
  - Taxable amount calculation (`subtotal - discount`).
  - GST 18% calculation (CGST 9% + SGST 9%).
  - Zero/negative amount and out-of-range rate rejection.
- [x] **Automated Recurring Billing (`generator.ts`)**:
  - Filters `active` subscriptions where `periodStart <= now`.
  - Determines calendar-aware renewal periods (monthly/yearly).
  - Atomically creates invoice and snapshot line items.
  - Advances `next_billing_date` and `current_period_end`.
- [x] **Duplicate Billing Protection**:
  - Pre-insert period query check.
  - Unique constraint handling (`code 23505`).
  - Retrying produces zero duplicate invoices.
- [x] **Invoice Lifecycle & Service (`invoice-service.ts`)**:
  - `generateInvoiceForSubscription()`
  - `getInvoices()` with search & status filters.
  - `getInvoiceById()` with full relational graph (customer, items, payments).
  - `confirmInvoice()` (draft &rarr; confirmed).
  - `cancelInvoice()` (voiding eligible invoices).
- [x] **Payment Processing Service (`payment-service.ts`)**:
  - `recordPayment()` with balance validation.
  - Partial payments update `outstanding_balance` and status to `partially_paid`.
  - Full settlement sets `outstanding_balance = 0` and status to `paid`.
  - Rejection of overpayments.
- [x] **Server Actions**:
  - `src/actions/invoices.ts`: `generateInvoiceAction`, `confirmInvoiceAction`, `cancelInvoiceAction`, `runBillingCycleAction`.
  - `src/actions/payments.ts`: `recordPaymentAction`.
- [x] **User Interface**:
  - `/invoices`: Live ledger, KPI telemetry, filter tabs, "Run Billing Cycle" trigger, payment recording modal.
  - `/invoices/[id]`: Full invoice view, line items breakdown, GST audit, settlement history, confirm/cancel buttons.
  - `/payments`: Transactions table, gateway/status filtering, "Record Offline Payment" modal dialog.
  - `/dashboard`: "Run Billing Cycle" trigger integrated into Quick Actions & Top Header.
  - `/api/billing/run`: POST endpoint for webhooks and cron schedulers.

---

## 3. File Structure

```text
src/
├── actions/
│   ├── invoices.ts                 # Server actions: generate, confirm, cancel, runBilling
│   └── payments.ts                 # Server action: recordPaymentAction with validation
│
├── app/
│   ├── (dashboard)/
│   │   ├── invoices/
│   │   │   ├── page.tsx            # Server route loading live invoices
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Server route for individual invoice
│   │   │       └── invoice-detail-client.tsx # Invoice detail client view & actions
│   │   └── payments/
│   │       └── page.tsx            # Server route loading live payments & unpaid invoices
│   └── api/
│       └── billing/
│           └── run/
│               └── route.ts        # POST/GET webhook API for recurring billing runs
│
├── components/
│   ├── invoices/
│   │   ├── InvoicesPage.tsx        # Invoices data table, KPIs, and Inspector
│   │   └── invoices-page.tsx       # Re-export wrapper
│   └── payments/
│       ├── PaymentsPage.tsx        # Payments transaction list & record modal
│       └── payments-page.tsx       # Re-export wrapper
│
├── lib/
│   └── billing/
│       ├── calculations.ts         # Pure monetary math engine (paise integer precision)
│       ├── calculator.ts           # Backwards-compatible calculation adapter
│       ├── tax-service.ts          # Tax rule loader & GST fallback
│       ├── discount-service.ts     # Promo code verification & eligibility check
│       ├── invoice-service.ts      # Querying, generation, confirmation, cancellation
│       ├── payment-service.ts      # Payment verification, balance math, status update
│       └── generator.ts            # Batch recurring billing cycle engine
│
supabase/
└── migrations/
    ├── 20261031000000_initial_schema.sql
    ├── 20261031000001_auth_profiles_trigger.sql
    └── 20261031000002_billing_and_payments.sql # Sequences, RLS policies, atomic RPC

tests/
└── unit/
    ├── calculator.test.mjs         # 19 comprehensive math & rounding unit tests
    └── billing-lifecycle.test.mjs  # 9 lifecycle, eligibility, duplicate & payment tests
```

---

## 4. How Invoice Calculations Work

Authoritative calculation sequence:
1. **Line Item Subtotals**: `unitPrice * quantity` computed in integer paise.
2. **Invoice Subtotal**: Sum of all line item subtotals.
3. **Discount Deduction**:
   - If percentage: `round((subtotal * percent) / 100)`.
   - If fixed: `toPaise(fixedAmount)`.
   - Capped at subtotal (taxable amount cannot be negative).
4. **Taxable Amount**: `max(0, subtotal - discount)`.
5. **GST Calculation**: `round((taxableAmount * taxRate) / 100)` (split into 9% CGST + 9% SGST for display).
6. **Grand Total**: `taxableAmount + totalTax`.
7. **Outstanding Balance**: `max(0, grandTotal - paidAmount)`.

---

## 5. Monetary Representation & Rounding Policy

- **Internal Representation**: All calculations are performed in integer **paise** (`rupees * 100`).
- **Rounding Strategy**: Standard round-half-up (`Math.round`) applied at boundary transitions.
- **Precision**: Output values are formatted to exact 2 decimal places in INR. No floating-point precision drift.
- **Validation**: Negative prices, non-positive quantities, and rates exceeding 100% throw explicit `RangeError`.

---

## 6. Invoice Lifecycle

```
[draft] ─── (confirmInvoiceAction) ───► [confirmed]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼ (Partial Payment)                         ▼ (Full Payment)
               [partially_paid]                                 [paid]
                       │ (Final Payment)                           ▲
                       └───────────────────────────────────────────┘
```
- **Draft**: Modifiable; not yet issued.
- **Confirmed**: Officially issued billing statement; line items snapshot immutable.
- **Partially Paid**: Has received recognized payments > 0, with positive balance remaining.
- **Paid**: Outstanding balance is exactly ₹0.00.
- **Cancelled**: Voided invoice; cannot receive further payments.

---

## 7. Payment Lifecycle & Reconciliation

- Payments require an existing invoice reference, amount > 0, and valid method.
- **Partial Payments**: Supported; outstanding balance decreases monotonically.
- **Overpayments**: Strictly rejected with `RangeError`.
- **Idempotency**: Generated payment numbers (e.g. `PAY-2026-001001`) prevent duplicate entries.
- **Settlement**: Only `completed` payments decrement the balance. `pending` and `failed` payments do not modify balances.

---

## 8. Discount Rules

- Promos loaded from `discounts` table.
- Codes are verified against `is_active = true` and `valid_until > now`.
- Discounts can be percentage (0–100%) or fixed INR amounts.
- Total discount is capped at subtotal so that taxable amounts never dip below zero.

---

## 9. Tax Rules

- Active rules queried from `tax_rules`.
- Default: Standard GST 18% (CGST 9% + SGST 9%).
- Tax rate and calculated amounts are snapshotted onto the invoice record at creation time so future tax policy changes do not mutate historical records.

---

## 10. Duplicate Billing Prevention

Duplicate protection is enforced at two levels:
1. **Application Query Level**: Checks for any existing invoice where `subscription_id = sub.id AND billing_period_start = start AND billing_period_end = end`.
2. **Database Constraint Level**: `UNIQUE(subscription_id, billing_period_start, billing_period_end)` raises Postgres error `23505`, which is captured gracefully and reported as a prevented duplicate.

---

## 11. Required Database Tables

- `invoices`: Core financial statement table.
- `invoice_items`: Detailed snapshot charges.
- `payments`: Financial settlement transactions.
- `discounts`: Promotional codes and terms.
- `tax_rules`: Active jurisdiction tax rates.
- Migration `20261031000002_billing_and_payments.sql` adds sequential numbering functions and missing RLS policies.

---

## 12. Server Actions and Service Interfaces

- `generateInvoiceAction(subscriptionId, options)`: Triggers on-demand invoice creation.
- `confirmInvoiceAction(invoiceId)`: Confirms a draft invoice.
- `cancelInvoiceAction(invoiceId)`: Voids an eligible invoice.
- `runBillingCycleAction()`: Runs batch billing cycle and returns `BillingRunResult`.
- `recordPaymentAction(formData)`: Server action for recording manual or offline payments.

---

## 13. How to Run Tests

Run the test suite using Node's native test runner:
```bash
npm test
```
To run specific suites:
```bash
node --experimental-strip-types --test tests/unit/calculator.test.mjs
node --experimental-strip-types --test tests/unit/billing-lifecycle.test.mjs
```
To run type checking:
```bash
npm run typecheck
```
To run build:
```bash
npm run build
```

---

## 14. Known Limitations

- Live card processing with external payment gateways (Stripe/Razorpay) is simulated via structured references (`reference: string`) for the hackathon environment.
- Automated email dispatch of PDF invoices is stubbed via browser printing dialog (`window.print()`).

---

## 15. Integration Dependencies on Members 2 and 4

- **Member 2 (Subscriptions)**: Relies on `subscriptions` having `status = 'active'` and valid `next_billing_date` and `subscription_items`.
- **Member 4 (Database & Auth)**: Relies on Supabase authentication session cookies and RLS policies on `invoices`, `invoice_items`, and `payments`. Migration `20261031000002_billing_and_payments.sql` should be executed in live Supabase SQL editor.

---

## 16. Demo Checklist

1. Navigate to `/dashboard` &rarr; click **Run Billing Cycle** (or navigate to `/invoices` &rarr; click **Run Billing Cycle**).
2. Verify banner reports invoices generated.
3. Click on the newly generated invoice &rarr; observe line items, subtotal, 18% GST breakdown, and outstanding balance.
4. Click **Record Payment** &rarr; enter partial amount (e.g. ₹2,000) &rarr; verify invoice transitions to **PARTIAL** with remaining balance.
5. Click **Record Payment** again &rarr; click **Pay Full Balance** &rarr; verify invoice transitions to **PAID** with balance ₹0.
6. Try clicking **Run Billing Cycle** again &rarr; verify that 0 duplicate invoices are created and the system reports `duplicates avoided`.
