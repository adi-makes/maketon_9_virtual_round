export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 px-8 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">SubscriptIQ Customer Portal</h1>
        <span className="text-sm text-gray-600">Acme Solutions</span>
      </header>
      <main className="p-8 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
