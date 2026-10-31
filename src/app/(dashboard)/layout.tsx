export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 p-4 text-white">
        <h2 className="text-xl font-bold tracking-tight">SubscriptIQ</h2>
        <nav className="mt-8 space-y-2">
          <a
            href="/dashboard"
            className="block rounded px-3 py-2 hover:bg-slate-800"
          >
            Dashboard
          </a>
          <a
            href="/products"
            className="block rounded px-3 py-2 hover:bg-slate-800"
          >
            Products
          </a>
          <a
            href="/subscriptions"
            className="block rounded px-3 py-2 hover:bg-slate-800"
          >
            Subscriptions
          </a>
          <a
            href="/invoices"
            className="block rounded px-3 py-2 hover:bg-slate-800"
          >
            Invoices
          </a>
          <a
            href="/payments"
            className="block rounded px-3 py-2 hover:bg-slate-800"
          >
            Payments
          </a>
        </nav>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">{children}</main>
    </div>
  );
}
