import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Building2, User } from "lucide-react";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let customerEmail = "customer@acme.com";
  const companyName = "Acme Corporation";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      customerEmail = user.email || customerEmail;
    }
  } catch {
    // Fallback
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-6 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm">
                S
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                SubscriptIQ
              </span>
            </Link>
            <span className="flex items-center space-x-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              <Building2 className="h-3 w-3" />
              <span>Customer Self-Service Portal</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden items-center space-x-2 text-right sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <User className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {companyName}
                </p>
                <p className="text-[11px] text-slate-500">{customerEmail}</p>
              </div>
            </div>

            <div className="w-24">
              <SignOutButton className="flex w-full cursor-pointer items-center justify-center space-x-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-6 sm:p-8">
        {children}
      </main>

      <footer className="border-t bg-white py-4 text-center text-xs text-slate-400">
        SubscriptIQ Customer Portal &bull; Powered by Brightloop Software
      </footer>
    </div>
  );
}
