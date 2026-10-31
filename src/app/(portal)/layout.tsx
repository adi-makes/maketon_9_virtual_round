export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white p-4 px-8">
        <h1 className="text-xl font-bold text-indigo-600">
          SubscriptIQ Customer Portal
        </h1>
        <span className="text-sm text-gray-600">Acme Solutions</span>
      </header>
      <main className="mx-auto max-w-6xl p-8">{children}</main>
    </div>
  );
}
