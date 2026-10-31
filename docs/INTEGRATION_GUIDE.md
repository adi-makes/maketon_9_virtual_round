# SubscriptIQ — End-to-End Integration Guide

This guide explains how the four distinct modules of SubscriptIQ integrate to demonstrate the complete, end-to-end subscription lifecycle.

---

## 🔄 The 7-Step Hackathon Demonstration Workflow

Follow this exact sequence to demonstrate the platform to judges and evaluators:

```
[1. Admin Login]
       │
       ▼
[2. Create Product & Variant] (Member 2)
       │
       ▼
[3. Create Subscription] (Member 2: Draft -> Quotation -> Confirmed -> Active)
       │
       ▼
[4. Run Billing Cycle] (Member 3: Generates Invoice + 18% GST)
       │
       ▼
[5. Duplicate Billing Test] (Member 3: Intercepts & prevents second run)
       │
       ▼
[6. Record Partial Payment] (Member 3: Balance updates, status -> Partially Paid)
       │
       ▼
[7. Verify Customer Portal] (Member 4: Customer sees only their own data)
```

---

## 🧪 Detailed Step Execution

### Step 1: Admin Authentication
1. Log in at `/login` as `admin@subscriptiq.com` (Password: `Password@123`).
2. Verify redirect to `/dashboard`.

### Step 2: Product & Plan Setup (Member 2)
1. Go to `/products` and create **Cloud Security Suite** (Base price: ₹2,000/mo).
2. Add a variant **Enterprise Tier** (+₹1,000 price adjustment).
3. Confirm total unit price calculates to ₹3,000/mo.

### Step 3: Subscription Lifecycle (Member 2)
1. Navigate to `/subscriptions` and create a subscription for **Acme Corporation**.
2. Advance through the state transitions:
   - `Draft` &rarr; `Quotation` &rarr; `Confirmed` &rarr; `Active`.
3. Confirm that setting status to `Active` computes the initial `next_billing_date`.

### Step 4: Automated Invoicing (Member 3)
1. Navigate to `/dashboard` and click **"Run Billing Cycle"**.
2. Open `/invoices` to confirm a new invoice was generated:
   - Line items: ₹3,000
   - GST (18%): ₹540
   - Total Invoice Amount: ₹3,540

### Step 5: Duplicate Billing Prevention (Member 3)
1. Immediately click **"Run Billing Cycle"** again.
2. The UI notification confirms: **1 duplicate billing attempt intercepted and avoided!**
3. Open `/invoices` and confirm no duplicate invoice was created for this billing period.

### Step 6: Payment Recording (Member 3)
1. Open the invoice on `/invoices/[id]`.
2. Record a partial payment of ₹2,000 via `manual_entry`.
3. Verify status automatically changes from `Confirmed` &rarr; `Partially Paid` and outstanding balance drops to ₹1,540.

### Step 7: Customer Isolation (Member 4)
1. Sign out of the Admin account.
2. Sign in as `customer@acme.com`.
3. The middleware redirects John Acme to `/portal`.
4. Verify that Acme Corporation sees their active subscription, invoice, and payment receipt, but has **zero visibility** into other companies or administrative controls.
