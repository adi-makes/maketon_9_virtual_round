export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        <p className="animate-pulse text-sm font-medium text-slate-600">
          Loading SubscriptIQ...
        </p>
      </div>
    </div>
  );
}
