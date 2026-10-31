export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 text-white p-4">
        <h2 className="text-xl font-bold tracking-tight">SubscriptIQ</h2>
        <nav className="mt-8 space-y-2">
          <a href="/dashboard" className="block py-2 px-3 rounded hover:bg-slate-800">Dashboard</a>
          <a href="/products" className="block py-2 px-3 rounded hover:bg-slate-800">Products</a>
          <a href="/subscriptions" className="block py-2 px-3 rounded hover:bg-slate-800">Subscriptions</a>
          <a href="/invoices" className="block py-2 px-3 rounded hover:bg-slate-800">Invoices</a>
          <a href="/payments" className="block py-2 px-3 rounded hover:bg-slate-800">Payments</a>
        </nav>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">{children}</main>
    </div>
  );
}
