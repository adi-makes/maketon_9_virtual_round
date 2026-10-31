import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/layout/sign-out-button";
import {
  LayoutDashboard,
  Package,
  Layers,
  FileText,
  CreditCard,
  Users,
  Shield,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail = "admin@subscriptiq.com";
  let userRole = "admin";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || userEmail;
      userRole =
        user.user_metadata?.role ||
        (user.email?.startsWith("staff@") ? "staff" : "admin");
    }
  } catch {
    // Graceful fallback for local development without credentials
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products & Variants", icon: Package },
    { href: "/plans", label: "Plans", icon: Layers },
    { href: "/subscriptions", label: "Subscriptions", icon: Users },
    { href: "/invoices", label: "Invoices", icon: FileText },
    { href: "/payments", label: "Payments", icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col justify-between border-r border-slate-800 bg-slate-950 text-slate-200">
        <div>
          {/* Brand Logo Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm">
                S
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                SubscriptIQ
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 p-4">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="border-t border-slate-800/80 bg-slate-900/50 p-4">
          <div className="mb-3 flex items-center space-x-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-600/20 text-indigo-400">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {userEmail}
              </p>
              <span className="inline-block rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                {userRole}
              </span>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="text-sm text-slate-500">
            Internal Operations Portal &bull; Brightloop Software
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Live Supabase
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
