# SubscriptIQ — Subscription & Revenue Lifecycle Management System

Built for **Brightloop Software** | 4-Member Hackathon Project

SubscriptIQ is a production-grade subscription management and recurring billing platform built using **Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, and Supabase (PostgreSQL & Supabase Auth)**.

---

## 🌟 Features Overview

- **Executive Analytics Dashboard (P0)**: Live MRR metrics, active subscriptions count, collected revenue, and outstanding balance charts.
- **Subscription Lifecycle Engine (P0)**: Multi-interval plans (monthly & yearly), product variants with price adjustments, and strict state transitions (`draft` &rarr; `quotation` &rarr; `confirmed` &rarr; `active` &rarr; `paused` &rarr; `closed`).
- **Automated Recurring Invoicing (P0)**: Batch billing runs, automated GST (18%) and discount calculations, and guaranteed **duplicate billing protection**.
- **Payment Recording & Tracking (P0)**: Real-time payment reconciliation against invoices with automated balance deductions.
- **Role-Based Access Control (P1)**: Multi-tenant permissions distinguishing `admin`, `staff`, and `customer` roles.
- **Customer Self-Service Portal (P1)**: Isolated customer view allowing clients to manage only their subscriptions and invoices.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) with React 18 |
| **Language** | TypeScript (Strict Mode) |
| **Styling & UI** | Tailwind CSS & shadcn/ui |
| **Icons & Charts** | Lucide React & Recharts |
| **Forms & Validation** | React Hook Form & Zod with `@hookform/resolvers` |
| **Database** | Supabase PostgreSQL (12 Relational Tables, RLS Enabled) |
| **Authentication** | Supabase Auth (`@supabase/ssr` with Cookie Management) |
| **Package Manager** | npm (Strictly npm only) |
| **Deployment** | Vercel |

---

## 📋 Prerequisites

Before starting, ensure you have:
1. **Git** (`>= 2.40`)
2. **Node.js** (`>= 18.18` or `20.x LTS`)
3. **npm** (`>= 9.x`)
4. Access to the shared **Supabase Project**

---

## 🚀 Quickstart Installation

### 1. Clone & Install
```bash
git clone <REPOSITORY_URL>
cd subscriptiq
npm install
```

### 2. Environment Configuration
Create your local environment file:
```bash
# On Linux / macOS
cp .env.example .env.local

# On Windows PowerShell
Copy-Item .env.example .env.local
```

Open `.env.local` and add the shared Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key
```

> [!IMPORTANT]
> **Strict Environment Policy**: All environment files must strictly reside in the repository root. Never commit `.env.local`. Run `npm run check:env-files` to verify compliance.

### 3. Database Initialization
Apply the complete 12-table starter schema to your Supabase project:
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** &rarr; **New Query**.
3. Copy and run the contents of [`supabase/migrations/20261031000000_initial_schema.sql`](file:///c:/Developments/subscriptiq/supabase/migrations/20261031000000_initial_schema.sql).
4. Run the contents of [`supabase/seed.sql`](file:///c:/Developments/subscriptiq/supabase/seed.sql) to populate initial demo plans and customers.

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The public landing page renders without requiring live database access.

---

## 🧪 Validation & Quality Scripts

Run these scripts before committing or merging:
```bash
# Validate .env.local syntax and keys without printing secrets
npm run check:env

# Ensure no nested .env files exist across the repository
npm run check:env-files

# Compile TypeScript typecheck across all files
npm run typecheck

# Check code formatting consistency
npm run format:check

# Run production build validation
npm run build
```

---

## 👥 Team Workspaces & Module Ownership

The project structure divides work across 4 dedicated workspaces:

- **[Member 1 Workspace](file:///c:/Developments/subscriptiq/team/member-1/README.md)**: Dashboard, layouts, charts, UI consistency (`feat/dashboard`).
- **[Member 2 Workspace](file:///c:/Developments/subscriptiq/team/member-2/README.md)**: Products, variants, plans, subscription lifecycle (`feat/subscriptions`).
- **[Member 3 Workspace](file:///c:/Developments/subscriptiq/team/member-3/README.md)**: Automated billing engine, invoices, taxes, duplicate prevention, payments (`feat/billing`).
- **[Member 4 Workspace](file:///c:/Developments/subscriptiq/team/member-4/README.md)**: Supabase Auth, profiles/roles, migrations, RLS, customer portal, deployment (`feat/auth-database`).

Refer to [`docs/TEAM_RESPONSIBILITIES.md`](file:///c:/Developments/subscriptiq/docs/TEAM_RESPONSIBILITIES.md) and [`CONTRIBUTING.md`](file:///c:/Developments/subscriptiq/CONTRIBUTING.md) for detailed guidelines.

---

## 🔑 Demo Accounts (Password: `Password@123`)
- **Admin**: `admin@subscriptiq.com` (Full administrative & billing control)
- **Staff**: `staff@subscriptiq.com` (Operational customer & quotation management)
- **Customer**: `customer@acme.com` (Self-service access to Acme Corp records)

---

## 📚 Architectural & Technical Documentation

- [`docs/ARCHITECTURE.md`](file:///c:/Developments/subscriptiq/docs/ARCHITECTURE.md): System layers, SSR middleware, and RBAC matrix.
- [`docs/DEVELOPMENT_SETUP.md`](file:///c:/Developments/subscriptiq/docs/DEVELOPMENT_SETUP.md): Comprehensive developer onboarding instructions.
- [`docs/ENVIRONMENT_VARIABLES.md`](file:///c:/Developments/subscriptiq/docs/ENVIRONMENT_VARIABLES.md): Complete catalog and security boundaries of all environment variables.
- [`docs/GIT_WORKFLOW.md`](file:///c:/Developments/subscriptiq/docs/GIT_WORKFLOW.md): Feature branch model and merge procedures.
- [`docs/CODING_CONVENTIONS.md`](file:///c:/Developments/subscriptiq/docs/CODING_CONVENTIONS.md): TypeScript strict typing and React conventions.
- [`docs/DATABASE_SCHEMA.md`](file:///c:/Developments/subscriptiq/docs/DATABASE_SCHEMA.md): Complete table layouts, foreign keys, and RLS rules.
- [`docs/INTEGRATION_GUIDE.md`](file:///c:/Developments/subscriptiq/docs/INTEGRATION_GUIDE.md): 7-step walkthrough for hackathon judge demonstrations.
- [`docs/TROUBLESHOOTING.md`](file:///c:/Developments/subscriptiq/docs/TROUBLESHOOTING.md): Fixes for common setup and integration errors.
