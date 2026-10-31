export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-600 animate-pulse">
          Loading SubscriptIQ...
        </p>
      </div>
    </div>
  );
}
