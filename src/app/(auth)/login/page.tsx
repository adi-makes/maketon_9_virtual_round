export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-8 border rounded-xl shadow-lg bg-white">
        <h1 className="text-2xl font-bold mb-4">Login to SubscriptIQ</h1>
        <p className="text-sm text-gray-500 mb-6">Enter your credentials to access the platform</p>
        <form className="space-y-4">
          <input className="w-full p-2 border rounded" placeholder="admin@subscriptiq.com" />
          <input className="w-full p-2 border rounded" type="password" placeholder="Password@123" />
          <button className="w-full py-2 bg-indigo-600 text-white rounded font-medium">Sign In</button>
        </form>
      </div>
    </div>
  );
}
