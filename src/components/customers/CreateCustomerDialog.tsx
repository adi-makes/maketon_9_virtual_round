"use client";

import { useState } from "react";
import { createCustomer, type CreateCustomerInput } from "@/actions/customers";
import {
  UserPlus,
  X,
  Mail,
  User,
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface CreateCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCustomerDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateCustomerDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    billingAddress: {
      line1: "",
      city: "Bengaluru",
      state: "Karnataka",
      postal_code: "",
      country: "India",
    },
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMsg("Valid email address is required.");
      return;
    }

    setIsPending(true);

    try {
      const result = await createCustomer(formData);

      if (!result.success) {
        setErrorMsg(result.error || "Failed to create customer.");
        setIsPending(false);
        return;
      }

      setSuccessMsg("Customer account created successfully in Supabase!");
      setIsPending(false);

      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          companyName: "",
          phone: "",
          billingAddress: {
            line1: "",
            city: "Bengaluru",
            state: "Karnataka",
            postal_code: "",
            country: "India",
          },
        });
        setSuccessMsg(null);
        onClose();
        if (onSuccess) onSuccess();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-headline-sm text-on-surface font-semibold tracking-tight">
                Add New Customer
              </h2>
              <p className="text-xs text-on-surface-variant font-body-sm">
                Register a new institutional client into Supabase directory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Contact Full Name */}
          <div>
            <label className="block text-xs font-label-md text-on-surface mb-1 font-medium">
              Primary Contact Name <span className="text-error">*</span>
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              />
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-label-md text-on-surface mb-1 font-medium">
              Official Billing Email <span className="text-error">*</span>
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              />
              <input
                type="email"
                required
                placeholder="billing@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Company Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-label-md text-on-surface mb-1 font-medium">
                Company Name
              </label>
              <div className="relative">
                <Building2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="e.g. Razorpay Inc"
                  value={formData.companyName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-label-md text-on-surface mb-1 font-medium">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Address Line & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-label-md text-on-surface mb-1 font-medium">
                Street Address
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="e.g. 100 Tech Park, Indiranagar"
                  value={formData.billingAddress?.line1 || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        line1: e.target.value,
                      },
                    }))
                  }
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-label-md text-on-surface mb-1 font-medium">
                City &amp; State
              </label>
              <input
                type="text"
                placeholder="Bengaluru, Karnataka"
                value={`${formData.billingAddress?.city || "Bengaluru"}, ${formData.billingAddress?.state || "Karnataka"}`}
                onChange={(e) => {
                  const parts = e.target.value.split(",");
                  setFormData((prev) => ({
                    ...prev,
                    billingAddress: {
                      ...prev.billingAddress,
                      city: parts[0]?.trim() || "Bengaluru",
                      state: parts[1]?.trim() || "Karnataka",
                    },
                  }));
                }}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-container-high/30">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs text-on-surface font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-xs text-on-primary font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              <span>{isPending ? "Creating..." : "Save Customer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
