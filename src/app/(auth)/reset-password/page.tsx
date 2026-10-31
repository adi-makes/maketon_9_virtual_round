"use client";

import { Suspense, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updatePasswordAction } from "@/actions/auth";
import { checkPasswordComplexity } from "@/lib/validations/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isExpiredParam = searchParams.get("error") === "expired";
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const checks = checkPasswordComplexity(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Check if session exists from auth callback
  useEffect(() => {
    if (isExpiredParam) {
      setIsSessionValid(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSessionValid(Boolean(session));
    });
  }, [isExpiredParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!checks.minLength) {
      setErrorMsg("Password with 8 or fewer characters rejected. Must be at least 9 characters.");
      return;
    }
    if (!checks.hasUpper) {
      setErrorMsg("Password without uppercase letter rejected.");
      return;
    }
    if (!checks.hasLower) {
      setErrorMsg("Password without lowercase letter rejected.");
      return;
    }
    if (!checks.hasSpecial) {
      setErrorMsg("Password without special character rejected.");
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await updatePasswordAction({ password, confirmPassword });
      if (!res.success) {
        setErrorMsg(res.error || "Failed to update password.");
      } else {
        setSuccessMsg("Password updated successfully! Redirecting to sign in...");
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 1500);
      }
    });
  };

  // 1. Loading check state
  if (isSessionValid === null) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 2. Scenario 11: Reset using expired/invalid link -> Rejected
  if (!isSessionValid) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
          <XCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Recovery Link Invalid or Expired</h3>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
          This password reset link is invalid or has expired. For your security, recovery links can only be used once within their expiration window.
        </p>
        <div className="mt-6">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            <span>Request New Reset Link</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Scenario 10: Reset password using valid link -> Password updated
  return (
    <div>
      <h3 className="mb-1 text-xl font-bold text-slate-900">Set New Password</h3>
      <p className="mb-6 text-xs text-slate-500">
        Enter a new secure password adhering to the security policy.
      </p>

      {errorMsg && (
        <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            New Password
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-10 text-sm placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Policy Indicators */}
          <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 space-y-1.5 text-xs">
            <span className="block font-semibold text-slate-600 text-[11px] uppercase tracking-wider mb-1">
              Required Security Rules:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div className={`flex items-center space-x-1.5 ${checks.minLength ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                {checks.minLength ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-300" />}
                <span>At least 9 characters</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${checks.hasUpper ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                {checks.hasUpper ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-300" />}
                <span>One uppercase letter</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${checks.hasLower ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                {checks.hasLower ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-300" />}
                <span>One lowercase letter</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${checks.hasSpecial ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                {checks.hasSpecial ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-300" />}
                <span>One special character</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Confirm New Password
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          {confirmPassword && (
            <div className="mt-1 flex items-center space-x-1 text-xs">
              {passwordsMatch ? (
                <span className="text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Passwords do not match
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || !checks.minLength || !checks.hasUpper || !checks.hasLower || !checks.hasSpecial || !passwordsMatch}
          className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <span>Update Password</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      </div>

      <div className="mt-6 px-4 sm:mx-auto sm:w-full sm:max-w-md sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-xl sm:px-10">
          <Suspense
            fallback={
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
