# Member 2 — Products, Plans & Subscriptions

**Owner:** Member 2 (Product & Subscription Lifecycle Lead)  
**Assigned Git Branch:** `feat/subscriptions`  
**Primary Focus:** Product catalog, variant pricing, plan configurations, and full subscription lifecycle management.

---

## 1. Assigned Responsibilities

- Implement Product management UI (product name, description, base price).
- Implement Product Variant pricing adjustments (e.g. Standard vs Enterprise tiers).
- Implement Plan management (monthly vs yearly intervals).
- Build the Subscription creation form (select customer, plan, quantity, variants).
- Implement Subscription lifecycle state transitions:
  - `draft` &rarr; `quotation` &rarr; `confirmed` &rarr; `active` &rarr; `paused` &rarr; `closed`.
- Enforce business logic on renewal dates and cancellation behavior (`cancel_at_period_end`).

---

## 2. Files Primarily Owned

- `src/app/(dashboard)/products/*`
- `src/app/(dashboard)/plans/*`
- `src/app/(dashboard)/subscriptions/*`
- `src/actions/subscriptions.ts`
- `src/components/forms/subscription-form.tsx`

---

## 3. Files Shared with Other Members

- `src/types/index.ts` (`Product`, `Plan`, `Subscription`, `SubscriptionStatus`)
- `src/types/database.ts`
- `src/lib/supabase/server.ts`

---

## 4. Dependencies on Other Modules

- **Member 4 (Database & Customers)**: Needs `customers` table to associate subscriptions with customer accounts.
- **Member 3 (Billing Engine)**: Member 3's invoicing engine reads active subscriptions produced by Member 2.

---

## 5. Required Inputs and Expected Outputs

- **Input**: User selections on customer, product, plan interval, and variant addons.
- **Output**: Persisted rows in `subscriptions` and `subscription_items` with calculated `next_billing_date`.

---

## 6. Acceptance Criteria

- [ ] Users can create a product with at least one variant that adjusts price.
- [ ] Subscriptions transition through valid state machine paths (`draft` &rarr; `quotation` &rarr; `confirmed` &rarr; `active`).
- [ ] Invalid state transitions (e.g. `closed` &rarr; `active`) throw a descriptive user-facing error.
- [ ] Activating a subscription sets the initial `current_period_start` and `next_billing_date`.

---

## 7. Integration Checklist

- [ ] Verify `src/actions/subscriptions.ts` updates Supabase without breaking constraints.
- [ ] Ensure subscription total price properly factors in `base_price + price_adjustment`.

---

## 8. Testing Checklist

- [ ] Test status transitions using the UI buttons on `/subscriptions/[id]`.
- [ ] Run `npm run typecheck` to verify all parameters match `SubscriptionStatus`.

---

## 9. Known Limitations

- Prorated mid-period plan upgrades are deferred; plan changes take effect at period end.
