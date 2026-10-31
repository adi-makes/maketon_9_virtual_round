export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Executive Dashboard</h1>
      <div className="grid grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-xl shadow border">
          <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
          <p className="text-2xl font-bold">₹7,500</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow border">
          <p className="text-sm text-gray-500">Active Subscriptions</p>
          <p className="text-2xl font-bold">1</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow border">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold">₹5,000</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow border">
          <p className="text-sm text-gray-500">Outstanding Balance</p>
          <p className="text-2xl font-bold">₹2,965</p>
        </div>
      </div>
    </div>
  );
}
