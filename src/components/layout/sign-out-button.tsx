"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={
        className ||
        "flex w-full cursor-pointer items-center space-x-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
      }
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      <span>{loading ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}
