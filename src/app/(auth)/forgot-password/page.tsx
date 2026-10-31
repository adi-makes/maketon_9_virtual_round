"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Send } from "lucide-react";
import { sendPasswordResetEmailAction } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    startTransition(async () => {
      const res = await sendPasswordResetEmailAction(email, origin);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to dispatch password recovery link.");
      } else {
        setSuccessMsg("Reset link sent to registered email. Please check your inbox.");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white shadow-md">
            S
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            SubscriptIQ
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered email address to receive a secure recovery link.
        </p>
      </div>

      <div className="mt-6 px-4 sm:mx-auto sm:w-full sm:max-w-md sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-xl sm:px-10">
          {errorMsg && (
            <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold">{successMsg}</p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Follow the instructions inside the email to complete password recovery.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Registered Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !email.trim()}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
