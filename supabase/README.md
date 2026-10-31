# Supabase Database & Migrations Guide

This directory manages the Supabase schema, version-controlled migrations, and starter seeds for **SubscriptIQ**.

---

## 📁 Structure

```text
supabase/
├── config.toml                       # Local Supabase emulator configuration
├── seed.sql                          # Safe demonstration data
├── README.md                         # This guide
└── migrations/
    └── 20261031000000_initial_schema.sql  # Baseline migration with all 12 tables & RLS
```

---

## 🚀 Applying the Database Schema

You can apply the schema to your shared Supabase project using either the **Supabase Dashboard** or the **Supabase CLI**.

### Option A: Using the Supabase Dashboard SQL Editor (Fastest)

1. Navigate to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project and click **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Copy and paste the entire contents of [`supabase/migrations/20261031000000_initial_schema.sql`](file:///c:/Developments/subscriptiq/supabase/migrations/20261031000000_initial_schema.sql).
5. Click **Run**. Verify that all 12 tables are created with `Success`.
6. Open a new query, paste the contents of [`supabase/seed.sql`](file:///c:/Developments/subscriptiq/supabase/seed.sql), and click **Run** to load initial demo records.

---

### Option B: Using the Supabase CLI (For Local Development)

If you have Docker and the Supabase CLI installed:

```bash
# Start local Supabase containers
npx supabase start

# Apply all migrations to local database
npx supabase db reset
```

---

## 🔒 Row-Level Security (RLS) Summary

All 12 tables have RLS enabled by default:
- **Public**: Can read active `products`, `variants`, and `plans`.
- **Admins & Staff**: Full access to all business data (customers, subscriptions, invoices, payments).
- **Customers**: Restricted by `auth.uid()` through the `profiles.customer_id` mapping. Customers can only read and manage records that belong to their customer account.
