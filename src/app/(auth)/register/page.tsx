"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { registerCustomerAction } from "@/actions/auth";
import { checkPasswordComplexity } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const checks = checkPasswordComplexity(formData.password);
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const isFormValid =
    formData.name.trim().length >= 2 &&
    formData.companyName.trim().length >= 2 &&
    formData.email.trim().length >= 5 &&
    checks.minLength &&
    checks.hasUpper &&
    checks.hasLower &&
    checks.hasSpecial &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Explicit client pre-checks
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
      const res = await registerCustomerAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || "Registration rejected.");
      } else {
        setSuccessMsg(res.message || "Account created successfully! Redirecting...");
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 1500);
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
          Create Customer Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access self-service subscriptions, recurring invoices, and payment portals.
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
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Full Name
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Company Name
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Acme Corp Technologies"
                  className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="billing@company.com"
                  className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              {/* Password Complexity Policy Indicators */}
              <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 space-y-1.5 text-xs">
                <span className="block font-semibold text-slate-600 text-[11px] uppercase tracking-wider mb-1">
                  Password Security Policy:
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

            {/* Confirm Password */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Confirm Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              {formData.confirmPassword && (
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !isFormValid}
              className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
