import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Activity,
  Terminal,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Navigation Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                SubscriptIQ
              </span>
              <span className="text-xs text-indigo-600 font-semibold ml-2 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">
                Brightloop Software
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/api/health"
              className="text-xs font-mono text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 bg-slate-50 flex items-center space-x-1.5 transition-colors"
              target="_blank"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>/api/health</span>
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center space-x-1"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-semibold text-indigo-700 mb-6">
              <Zap className="w-3.5 h-3.5" />
              <span>Subscription & Recurring Billing Management Foundation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
              Precision billing and lifecycle management for modern software.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              SubscriptIQ provides Brightloop Software with a unified platform
              to manage products, multi-frequency plans, subscription
              lifecycles, automated invoicing with tax rules, and payments.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                <span>Open Starter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/portal"
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-300 shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                <span>Customer Self-Service Portal</span>
              </Link>
            </div>
          </div>

          {/* Module Architecture Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {/* Member 1 Module */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Dashboard & Analytics
              </h2>
              <p className="text-xs text-blue-600 font-medium mb-3">
                Maintained by Member 1
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Executive MRR metrics, revenue collected, outstanding balance
                charts, and unified layout navigation.
              </p>
            </div>

            {/* Member 2 Module */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Products & Subscriptions
              </h2>
              <p className="text-xs text-indigo-600 font-medium mb-3">
                Maintained by Member 2
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Product catalog, variant price adjustments, monthly/annual
                plans, and subscription lifecycle transitions.
              </p>
            </div>

            {/* Member 3 Module */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Billing & Invoicing
              </h2>
              <p className="text-xs text-emerald-600 font-medium mb-3">
                Maintained by Member 3
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated invoice generation, tax & discount engines, duplicate
                billing prevention, and payment tracking.
              </p>
            </div>

            {/* Member 4 Module */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Auth & Database
              </h2>
              <p className="text-xs text-amber-600 font-medium mb-3">
                Maintained by Member 4
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Supabase Auth integration, user roles (Admin, Staff, Customer),
                Row-Level Security, and Customer Portal.
              </p>
            </div>
          </div>

          {/* Quickstart Developer Instructions Banner */}
          <div className="mt-16 bg-slate-900 text-slate-100 rounded-2xl p-8 shadow-lg border border-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-2">
                  <Terminal className="w-4 h-4" />
                  <span>Developer Getting Started</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Ready for team parallel development
                </h3>
                <p className="text-sm text-slate-400 max-w-xl">
                  Run{" "}
                  <code className="text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                    npm run check:env
                  </code>{" "}
                  to verify your environment configuration, or inspect{" "}
                  <code className="text-indigo-400 bg-slate-800 px-2 py-0.5 rounded">
                    docs/DEVELOPMENT_SETUP.md
                  </code>{" "}
                  for complete team guidelines.
                </p>
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <Link
                  href="/login"
                  className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg text-center transition-colors"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SubscriptIQ — Brightloop Software. Hackathon Foundation.</p>
          <div className="flex items-center space-x-6">
            <Link href="/api/health" className="hover:text-slate-900">
              System Health
            </Link>
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
