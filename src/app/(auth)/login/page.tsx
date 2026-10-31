export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">Login to SubscriptIQ</h1>
        <p className="mb-6 text-sm text-gray-500">
          Enter your credentials to access the platform
        </p>
        <form className="space-y-4">
          <input
            className="w-full rounded border p-2"
            placeholder="admin@subscriptiq.com"
          />
          <input
            className="w-full rounded border p-2"
            type="password"
            placeholder="Password@123"
          />
          <button className="w-full rounded bg-indigo-600 py-2 font-medium text-white">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
