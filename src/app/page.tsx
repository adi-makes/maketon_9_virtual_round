import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white shadow-sm">
              S
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                SubscriptIQ
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Sign Up
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center space-x-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <span>Dashboard</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Subscription Management Platform
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-slate-600">
              SubscriptIQ provides modern businesses with a unified platform
              to manage products, multi-frequency plans, subscription
              lifecycles, automated invoicing with tax rules, and payments.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
              >
                <span>Open Starter Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="flex w-full items-center justify-center space-x-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:w-auto"
              >
                <span>Sign Up as Customer</span>
              </Link>
            </div>
          </div>

          {/* Core Platform Features Grid */}
          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1: Revenue Analytics */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Layers className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-base font-bold text-slate-900">
                Revenue Analytics
              </h2>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600">
                Executive Insights
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Monitor live MRR, gross recurring cashflow, outstanding balances,
                and cohort growth trajectories with interactive timeline charts.
              </p>
            </div>

            {/* Feature 2: Subscription Lifecycles */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-base font-bold text-slate-900">
                Subscription Engine
              </h2>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                State Machine Logic
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Configure multi-tier pricing, product variants, and flexible plans
                with strict lifecycle transitions from draft to active renewal.
              </p>
            </div>

            {/* Feature 3: Invoicing & Taxes */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-base font-bold text-slate-900">
                Automated Invoicing
              </h2>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Tax & Duplicate Guard
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Automate recurring billing batches with 18% GST rules, discount
                deductions, and guaranteed duplicate billing prevention.
              </p>
            </div>

            {/* Feature 4: Access Governance */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-base font-bold text-slate-900">
                Access & Security
              </h2>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-600">
                Enterprise Governance
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Multi-tenant permissions distinguishing Admin, Staff, and Customer
                roles, secured by Supabase Row-Level Security policies.
              </p>
            </div>
          </div>


        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 SubscriptIQ. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="hover:text-slate-900">
              Internal Dashboard
            </Link>
            <Link href="/register" className="hover:text-slate-900">
              Customer Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
