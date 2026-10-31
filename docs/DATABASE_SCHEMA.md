# SubscriptIQ — Database Schema Documentation

This document describes the 12 core relational tables in the Supabase PostgreSQL database, their foreign key relationships, precision constraints, and Row-Level Security (RLS) model.

---

## 🗄️ Relational Entity-Relationship Summary

```
auth.users (Supabase Auth)
     │
     ▼ (1:1)
  profiles ────────► customers (1:N)
                         │
                         ├─────────────────────────┐
                         ▼ (1:N)                   ▼ (1:N)
                   subscriptions               invoices
                         │                         │
                         ├─────────► plans         ├────────► invoice_items (1:N)
                         │             │           │
                         │             ▼           ▼ (1:N)
                         │          products    payments
                         ▼             │
                  subscription_items   ▼
                         │      product_variants
                         ▼
```

---

## 📋 The 12 Tables in Detail

### 1. `customers`
Stores customer organizations and billing contacts.
- `id` (UUID, PK)
- `name` (TEXT)
- `email` (TEXT, Unique)
- `company_name` (TEXT)
- `billing_address` (JSONB)
- `phone` (TEXT)

### 2. `profiles`
Extends `auth.users` with application-specific RBAC roles and links to customers.
- `id` (UUID, PK &rarr; `auth.users.id` ON DELETE CASCADE)
- `email` (TEXT)
- `full_name` (TEXT)
- `role` (TEXT, CHECK: `'admin'`, `'staff'`, `'customer'`)
- `customer_id` (UUID, FK &rarr; `customers.id`)

### 3. `products`
Master catalog of software offerings.
- `id` (UUID, PK)
- `name` (TEXT)
- `description` (TEXT)
- `base_price` (NUMERIC(12,2))
- `is_active` (BOOLEAN)

### 4. `product_variants`
Configurable product tiers and add-ons.
- `id` (UUID, PK)
- `product_id` (UUID, FK &rarr; `products.id` ON DELETE CASCADE)
- `name` (TEXT)
- `price_adjustment` (NUMERIC(12,2))
- `sku` (TEXT, Unique)

### 5. `plans`
Billing interval models for products.
- `id` (UUID, PK)
- `product_id` (UUID, FK &rarr; `products.id` ON DELETE CASCADE)
- `name` (TEXT)
- `billing_frequency` (TEXT, CHECK: `'monthly'`, `'yearly'`)
- `interval_count` (INTEGER, Default 1)
- `is_active` (BOOLEAN)

### 6. `subscriptions`
Customer subscription contracts and active lifecycles.
- `id` (UUID, PK)
- `customer_id` (UUID, FK &rarr; `customers.id`)
- `plan_id` (UUID, FK &rarr; `plans.id`)
- `status` (TEXT, CHECK: `'draft'`, `'quotation'`, `'confirmed'`, `'active'`, `'paused'`, `'closed'`)
- `start_date` (TIMESTAMPTZ)
- `current_period_start` / `current_period_end` (TIMESTAMPTZ)
- `next_billing_date` (TIMESTAMPTZ)
- `cancel_at_period_end` (BOOLEAN)

### 7. `subscription_items`
Individual line items attached to a subscription.
- `id` (UUID, PK)
- `subscription_id` (UUID, FK &rarr; `subscriptions.id` ON DELETE CASCADE)
- `variant_id` (UUID, FK &rarr; `product_variants.id`)
- `quantity` (INTEGER)
- `unit_price` (NUMERIC(12,2))

### 8. `invoices`
Generated billing statements with duplicate billing protection.
- `id` (UUID, PK)
- `invoice_number` (TEXT, Unique)
- `subscription_id` (UUID, FK &rarr; `subscriptions.id`)
- `customer_id` (UUID, FK &rarr; `customers.id`)
- `billing_period_start` / `billing_period_end` (TIMESTAMPTZ)
- `due_date` (TIMESTAMPTZ)
- `subtotal` (NUMERIC(12,2))
- `discount_amount` (NUMERIC(12,2))
- `tax_amount` (NUMERIC(12,2))
- `total_amount` (NUMERIC(12,2))
- `paid_amount` (NUMERIC(12,2))
- `outstanding_balance` (NUMERIC(12,2))
- `status` (TEXT, CHECK: `'draft'`, `'confirmed'`, `'partially_paid'`, `'paid'`, `'cancelled'`)
- **Unique Constraint**: `UNIQUE(subscription_id, billing_period_start, billing_period_end)`

### 9. `invoice_items`
Detailed breakdown of charges on an invoice.
- `id` (UUID, PK)
- `invoice_id` (UUID, FK &rarr; `invoices.id` ON DELETE CASCADE)
- `description` (TEXT)
- `quantity` (INTEGER)
- `unit_price` (NUMERIC(12,2))
- `amount` (NUMERIC(12,2))

### 10. `payments`
Financial transactions recorded against invoices.
- `id` (UUID, PK)
- `payment_number` (TEXT, Unique)
- `invoice_id` (UUID, FK &rarr; `invoices.id`)
- `customer_id` (UUID, FK &rarr; `customers.id`)
- `amount` (NUMERIC(12,2))
- `method` (TEXT, CHECK: `'manual_entry'`, `'bank_transfer'`, `'stripe'`, `'razorpay'`)
- `reference` (TEXT)
- `status` (TEXT, CHECK: `'pending'`, `'completed'`, `'failed'`, `'refunded'`)

### 11. `discounts`
Promotional codes and price reductions.
- `id` (UUID, PK)
- `code` (TEXT, Unique)
- `discount_percent` (NUMERIC(5,2))
- `fixed_amount` (NUMERIC(12,2))
- `is_active` (BOOLEAN)
- `valid_until` (TIMESTAMPTZ)

### 12. `tax_rules`
Tax rate definitions (e.g. GST 18%).
- `id` (UUID, PK)
- `name` (TEXT)
- `rate_percent` (NUMERIC(5,2), Default 18.00)
- `is_active` (BOOLEAN)
