import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Terminal,
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
              <span className="ml-2 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                Brightloop Software
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
            <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Zap className="h-3.5 w-3.5" />
              <span>
                Subscription & Recurring Billing Management Foundation
              </span>
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Precision billing and lifecycle management for modern software.
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-slate-600">
              SubscriptIQ provides Brightloop Software with a unified platform
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
                href="/portal"
                className="flex w-full items-center justify-center space-x-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:w-auto"
              >
                <span>Customer Self-Service Portal</span>
              </Link>
            </div>
          </div>

          {/* Module Architecture Overview Grid */}
          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Member 1 Module */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Layers className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-base font-bold text-slate-900">
                Dashboard & Analytics
              </h2>
              <p className="mb-3 text-xs font-medium text-blue-600">
                Maintained by Member 1
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Executive MRR metrics, revenue collected, outstanding balance
                charts, and unified layout navigation.
              </p>
            </div>

            {/* Member 2 Module */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-base font-bold text-slate-900">
                Products & Subscriptions
              </h2>
              <p className="mb-3 text-xs font-medium text-indigo-600">
                Maintained by Member 2
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Product catalog, variant price adjustments, monthly/annual
                plans, and subscription lifecycle transitions.
              </p>
            </div>

            {/* Member 3 Module */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-base font-bold text-slate-900">
                Billing & Invoicing
              </h2>
              <p className="mb-3 text-xs font-medium text-emerald-600">
                Maintained by Member 3
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Automated invoice generation, tax & discount engines, duplicate
                billing prevention, and payment tracking.
              </p>
            </div>

            {/* Member 4 Module */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-base font-bold text-slate-900">
                Auth & Database
              </h2>
              <p className="mb-3 text-xs font-medium text-amber-600">
                Maintained by Member 4
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Supabase Auth integration, user roles (Admin, Staff, Customer),
                Row-Level Security, and Customer Portal.
              </p>
            </div>
          </div>

          {/* Quickstart Developer Instructions Banner */}
          <div className="mt-16 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-100 shadow-lg">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="mb-2 flex items-center space-x-2 font-mono text-xs uppercase tracking-wider text-indigo-400">
                  <Terminal className="h-4 w-4" />
                  <span>Developer Getting Started</span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  Ready for team parallel development
                </h3>
                <p className="max-w-xl text-sm text-slate-400">
                  Run{" "}
                  <code className="rounded bg-slate-800 px-2 py-0.5 text-emerald-400">
                    npm run check:env
                  </code>{" "}
                  to verify your environment configuration, or inspect{" "}
                  <code className="rounded bg-slate-800 px-2 py-0.5 text-indigo-400">
                    docs/DEVELOPMENT_SETUP.md
                  </code>{" "}
                  for complete team guidelines.
                </p>
              </div>

              <div className="flex w-full items-center space-x-3 md:w-auto">
                <Link
                  href="/login"
                  className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500 md:w-auto"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 SubscriptIQ — Brightloop Software. Hackathon Foundation.</p>
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="hover:text-slate-900">
              Internal Dashboard
            </Link>
            <Link href="/portal" className="hover:text-slate-900">
              Customer Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
