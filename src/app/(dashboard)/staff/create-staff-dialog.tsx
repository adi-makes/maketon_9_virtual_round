"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStaffMember, type CreateStaffInput } from "@/actions/staff";
import {
  UserPlus,
  X,
  KeyRound,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface CreateStaffDialogProps {
  isConfigured: boolean;
}

export function CreateStaffDialog({ isConfigured }: CreateStaffDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateStaffInput>({
    fullName: "",
    email: "",
    password: "",
  });

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let generated = "Sub#";
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: generated }));
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPending(true);

    try {
      const res = await createStaffMember(formData);

      if (!res.success) {
        setErrorMsg(res.error || "Failed to create staff member.");
        setIsPending(false);
        return;
      }

      setSuccessMsg(res.message || "Account created successfully!");
      setIsPending(false);

      // Reset form and refresh router after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg(null);
        setFormData({
          fullName: "",
          email: "",
          password: "",
        });
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setErrorMsg(null);
          setSuccessMsg(null);
        }}
        className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
      >
        <UserPlus className="h-4 w-4" />
        <span>Add Staff Member</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => !isPending && setIsOpen(false)}
          />

          {/* Dialog Modal */}
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Create New Staff Account
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Provision internal credentials with pre-verified email access.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isPending && setIsOpen(false)}
                disabled={isPending}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Config Warning banner if service role key is absent */}
            {!isConfigured && (
              <div className="mt-4 flex items-start space-x-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold">Notice:</span>{" "}
                  <code>SUPABASE_SECRET_KEY</code> is not yet configured in your{" "}
                  <code>.env.local</code>. Please copy your <code>service_role</code> secret from the Supabase Dashboard to complete user creation.
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 flex items-start space-x-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <p className="text-xs leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mt-4 flex items-center space-x-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-medium">{successMsg}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="e.g. Sarah Jenkins"
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Staff Email Address
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="staff.sarah@subscriptiq.com"
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-generate</span>
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Min. 6 characters"
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Role: Staff Operator */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                  <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Role
                  </span>
                  <span>Staff Operator</span>
                </div>
                <p className="mt-1 text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                  Staff operators have permissions to manage subscriptions, customers, invoices, and payments.
                </p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
