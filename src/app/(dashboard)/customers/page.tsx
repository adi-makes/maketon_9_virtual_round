"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Rocket,
  AlertTriangle,
  ArrowUp,
  Search,
  ChevronDown,
  SlidersHorizontal,
  MoreVertical,
  ChevronRight,
  MapPin,
  X,
  AlertCircle,
  Cpu,
  BellRing,
  Receipt,
  FileEdit,
  Clock,
  ShieldCheck,
  Download,
  PlusCircle,
} from "lucide-react";
import {
  mockCustomers,
  mockSubscriptions,
  mockInvoices,
  mockPayments,
} from "@/lib/mock-data";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { Database } from "@/types/database";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

interface Address {
  line1?: string;
  city?: string;
  state?: string | null;
  postal_code?: string;
  country?: string;
}

interface InstitutionalMeta {
  initials: string;
  colorClass: string;
  legalEntity: string;
  gstin: string;
  pan: string;
  residency: string;
  status: "active" | "at_risk" | "trial" | "onboarding";
  tierName: string;
  tierSla: string;
  renewal: string;
  pocRole: string;
  mrr: number;
  ltv: number;
  overdue: number;
  overdueInvoiceRef?: string;
  overdueDays?: number;
}

// Institutional enterprise details mapping for realistic B2B Indian fintech SaaS billing
const institutionalData: Record<string, InstitutionalMeta> = {
  "cust-001": {
    initials: "SW",
    colorClass: "bg-orange-100 text-orange-700",
    legalEntity: "Bundl Technologies Pvt Ltd",
    gstin: "29AAFCS0823H1Z2",
    pan: "AAFCS0823H",
    residency: "Karnataka, India (State Code 29)",
    status: "active",
    tierName: "Enterprise Tier 3",
    tierSla: "50M monthly calls • 99.99% Dedicated SLA",
    renewal: "Renews Nov 2025",
    pocRole: "VP Engineering & FinOps",
    mrr: 118000,
    ltv: 1420000,
    overdue: 0,
  },
  "cust-002": {
    initials: "BP",
    colorClass: "bg-sky-100 text-sky-700",
    legalEntity: "Resilient Innovations Pvt Ltd",
    gstin: "07AALCR4410K1ZT",
    pan: "AALCR4410K",
    residency: "Delhi, India (State Code 07)",
    status: "active",
    tierName: "Enterprise Plan",
    tierSla: "20M monthly calls • 99.95% SLA",
    renewal: "Renews Jan 2026",
    pocRole: "FinOps Lead",
    mrr: 82000,
    ltv: 980000,
    overdue: 0,
  },
  "cust-003": {
    initials: "ZB",
    colorClass: "bg-blue-100 text-blue-800",
    legalEntity: "Zerodha Broking Limited (KA)",
    gstin: "29AABCB8823M1Z9",
    pan: "AABCB8823M",
    residency: "Karnataka, India (State Code 29)",
    status: "at_risk",
    tierName: "Enterprise API Gateway (Tier 3)",
    tierSla: "10M monthly calls • 99.99% Dedicated SLA",
    renewal: "Renews Oct 2025",
    pocRole: "Head of Infra & FinOps",
    mrr: 75000,
    ltv: 840000,
    overdue: 28320,
    overdueInvoiceRef: "INV-2024-0890",
    overdueDays: 18,
  },
  "cust-004": {
    initials: "FK",
    colorClass: "bg-amber-100 text-amber-800",
    legalEntity: "Flipkart Internet Pvt Ltd",
    gstin: "29AAECF3849A1Z1",
    pan: "AAECF3849A",
    residency: "Karnataka, India (State Code 29)",
    status: "active",
    tierName: "Enterprise Scale Max",
    tierSla: "100M monthly calls • Multi-region 99.999% SLA",
    renewal: "Renews Dec 2025",
    pocRole: "Chief Procurement Officer",
    mrr: 187500,
    ltv: 2250000,
    overdue: 0,
  },
  "cust-005": {
    initials: "PM",
    colorClass: "bg-orange-100 text-orange-800",
    legalEntity: "Postman Software India Pvt Ltd",
    gstin: "29AAGCP4501F1ZV",
    pan: "AAGCP4501F",
    residency: "Karnataka, India (State Code 29)",
    status: "trial",
    tierName: "Sandbox Pro (Trial)",
    tierSla: "1M calls sandbox limit • Business Hours SLA",
    renewal: "Expires in 14 days",
    pocRole: "Principal Platform Architect",
    mrr: 15000,
    ltv: 115000,
    overdue: 0,
  },
  "cust-006": {
    initials: "CR",
    colorClass: "bg-zinc-900 text-white",
    legalEntity: "Dreamplug Technologies Pvt Ltd",
    gstin: "29AAGCD8912P1ZN",
    pan: "AAGCD8912P",
    residency: "Karnataka, India (State Code 29)",
    status: "active",
    tierName: "Enterprise Cloud",
    tierSla: "35M monthly calls • 99.99% SLA",
    renewal: "Renews Mar 2026",
    pocRole: "Head of Infrastructure",
    mrr: 136000,
    ltv: 1640000,
    overdue: 0,
  },
  "cust-007": {
    initials: "PL",
    colorClass: "bg-emerald-100 text-emerald-800",
    legalEntity: "Pine Labs Pvt Ltd (Noida)",
    gstin: "07AAACP1820J1ZY",
    pan: "AAACP1820J",
    residency: "Uttar Pradesh, India (State Code 09)",
    status: "onboarding",
    tierName: "Setup Stage (POC)",
    tierSla: "Dedicated Integration Engineer",
    renewal: "Go-live Q4 FY25",
    pocRole: "Director of Technical Integrations",
    mrr: 0,
    ltv: 0,
    overdue: 0,
  },
  "cust-008": {
    initials: "OD",
    colorClass: "bg-purple-100 text-purple-800",
    legalEntity: "Orbit Data Solutions Pvt Ltd",
    gstin: "27AABCO9910D1Z4",
    pan: "AABCO9910D",
    residency: "Maharashtra, India (State Code 27)",
    status: "active",
    tierName: "Enterprise Standard",
    tierSla: "15M monthly calls • 99.95% SLA",
    renewal: "Renews Feb 2026",
    pocRole: "Lead Platform Engineer",
    mrr: 95000,
    ltv: 720000,
    overdue: 0,
  },
};

const formatINR = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export default function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cust-003");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<"month" | "quarter">("month");
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Helper to parse address
  const getAddress = (customer: CustomerRow): Address => {
    if (
      !customer.billing_address ||
      typeof customer.billing_address !== "object" ||
      Array.isArray(customer.billing_address)
    ) {
      return { line1: "JP Nagar 4th Phase", city: "Bengaluru", state: "KA", country: "IN" };
    }
    return customer.billing_address as Address;
  };

  // Helper to get institutional metadata
  const getMeta = (customer: CustomerRow): InstitutionalMeta => {
    if (institutionalData[customer.id]) {
      return institutionalData[customer.id];
    }
    const initials = (
      customer.company_name?.slice(0, 2) ||
      customer.name.slice(0, 2) ||
      "CU"
    ).toUpperCase();
    return {
      initials,
      colorClass: "bg-indigo-100 text-indigo-700",
      legalEntity: customer.company_name || `${customer.name} Enterprise`,
      gstin: "29AAACX1234F1Z0",
      pan: "AAACX1234F",
      residency: "Karnataka, India (State Code 29)",
      status: "active",
      tierName: "Enterprise Tier 1",
      tierSla: "10M monthly calls • 99.9% SLA",
      renewal: "Renews Dec 2025",
      pocRole: "Account FinOps Contact",
      mrr: 50000,
      ltv: 600000,
      overdue: 0,
    };
  };

  // Filtered dataset
  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter((c) => {
      const meta = getMeta(c);
      const company = c.company_name || "";
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.legalEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.gstin.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || meta.status === statusFilter;

      const matchesTier =
        tierFilter === "all" ||
        (tierFilter === "enterprise" && meta.tierName.toLowerCase().includes("enterprise")) ||
        (tierFilter === "trial" && meta.status === "trial") ||
        (tierFilter === "setup" && meta.status === "onboarding");

      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [searchQuery, statusFilter, tierFilter]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return (
      mockCustomers.find((c) => c.id === selectedCustomerId) ||
      mockCustomers[0]
    );
  }, [selectedCustomerId]);

  const selectedMeta = getMeta(selectedCustomer);
  const selectedAddress = getAddress(selectedCustomer);

interface CustomerInvoiceDisplay {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  isOverdue: boolean;
  statusLabel: string;
}

  // Invoices for selected customer
  const customerInvoices = useMemo<CustomerInvoiceDisplay[]>(() => {
    const invs = mockInvoices.filter((i) => i.customer_id === selectedCustomer.id);
    if (invs.length > 0) {
      return invs.slice(0, 3).map((i) => {
        const isOverdue =
          i.outstanding_balance > 0 && i.status !== "paid" && i.status !== "cancelled";
        return {
          id: i.id,
          invoice_number: i.invoice_number,
          amount: i.total_amount,
          due_date: i.due_date
            ? new Date(i.due_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A",
          isOverdue,
          statusLabel: isOverdue ? "Overdue" : i.status === "paid" ? "Settled" : "Pending",
        };
      });
    }
    // Contextual sample invoices if no direct linked mock invoices
    return [
      {
        id: "inv-sample-1",
        invoice_number: selectedMeta.overdueInvoiceRef || "INV-2024-0890",
        amount: selectedMeta.overdue || 28320,
        due_date: "Oct 15, 2024",
        isOverdue: selectedMeta.overdue > 0,
        statusLabel: selectedMeta.overdue > 0 ? "Overdue" : "Settled",
      },
      {
        id: "inv-sample-2",
        invoice_number: "INV-2024-0744",
        amount: selectedMeta.mrr || 75000,
        due_date: "Sep 14, 2024 via NEFT",
        isOverdue: false,
        statusLabel: "Settled",
      },
      {
        id: "inv-sample-3",
        invoice_number: "INV-2024-0612",
        amount: selectedMeta.mrr || 75000,
        due_date: "Aug 14, 2024 via RTGS",
        isOverdue: false,
        statusLabel: "Settled",
      },
    ];
  }, [selectedCustomer.id, selectedMeta]);

  // Status Badge Component
  const renderStatusBadge = (status: InstitutionalMeta["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-emerald-50 text-emerald-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case "at_risk":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-rose-50 text-rose-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            At Risk
          </span>
        );
      case "trial":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-blue-50 text-blue-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Trial
          </span>
        );
      case "onboarding":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-amber-50 text-amber-800 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Onboarding
          </span>
        );
    }
  };

  // Define Columns for the DataTable
  const columns: ColumnDef<CustomerRow>[] = [
    {
      header: "Customer & GSTIN",
      cell: (customer) => {
        const meta = getMeta(customer);
        const displayName = customer.company_name || customer.name;
        const isSelected = selectedCustomer?.id === customer.id;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 shadow-xs ${meta.colorClass}`}
            >
              {meta.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-headline-sm text-headline-sm leading-tight truncate text-sm ${
                    isSelected ? "font-bold text-primary" : "font-semibold text-on-surface"
                  }`}
                >
                  {displayName}
                </span>
                {meta.overdue > 0 && (
                  <span
                    className="w-2 h-2 rounded-full bg-error flex-shrink-0"
                    title="Action required: Overdue invoices"
                  />
                )}
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate text-xs">
                {meta.legalEntity}
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant/80 text-[10px]">
                GST: {meta.gstin}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Primary Contact",
      cell: (customer) => (
        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-on-surface font-medium text-xs">
            {customer.name}
          </span>
          <span className="text-on-surface-variant truncate text-[11px]">
            {customer.email}
          </span>
          <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant/70 text-[11px]">
            {customer.phone || "+91 98450 12890"}
          </span>
        </div>
      ),
    },
    {
      header: "Subscriptions",
      align: "center",
      cell: (customer) => {
        const meta = getMeta(customer);
        const subsCount =
          mockSubscriptions.filter(
            (s) => s.customer_id === customer.id && s.status === "active"
          ).length || (meta.status === "onboarding" ? 0 : meta.status === "trial" ? 1 : 2);

        return (
          <div className="inline-flex flex-col items-center">
            <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface text-xs">
              {meta.status === "onboarding"
                ? "0 Live"
                : meta.status === "trial"
                ? "1 Trial"
                : `${subsCount} Active`}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-label-sm bg-purple-50 text-purple-700 font-medium">
              {meta.tierName.split(" ")[0]}
            </span>
          </div>
        );
      },
    },
    {
      header: "Lifetime Rev",
      align: "right",
      cell: (customer) => {
        const meta = getMeta(customer);
        return (
          <div className="flex flex-col items-end">
            <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold text-xs">
              {formatINR(meta.ltv)}
            </span>
            {meta.overdue > 0 ? (
              <div className="font-mono-data-sm text-[10px] text-error font-medium">
                {formatINR(meta.overdue)} overdue
              </div>
            ) : (
              <div className="font-mono-data-sm text-[10px] text-on-surface-variant">
                MRR {formatINR(meta.mrr)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      align: "center",
      cell: (customer) => {
        const meta = getMeta(customer);
        return renderStatusBadge(meta.status);
      },
    },
    {
      header: "",
      align: "center",
      cell: (customer) => {
        const isSelected = selectedCustomer?.id === customer.id;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCustomerId(customer.id);
              setIsDrawerOpen(true);
            }}
            className={`p-1 rounded transition-colors ${
              isSelected
                ? "bg-primary-container text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            {isSelected ? <ChevronRight size={16} /> : <MoreVertical size={16} />}
          </button>
        );
      },
    },
  ];

  return (
    <main className="w-full pt-16 flex-1 px-gutter-md py-space-lg bg-surface min-h-screen">
      <div className="flex flex-col w-full space-y-space-lg">
        {/* Page Header & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase bg-surface-container-high px-2 py-0.5 rounded text-[11px] font-semibold">
                CLIENT DIRECTORY &amp; ACCOUNT HEALTH
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-xs">
                • FY 2024-25 Q3
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight text-2xl lg:text-3xl font-semibold">
              Customers
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm">
              Manage institutional client accounts, billing contacts, GST compliance, and lifetime revenue.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center flex-wrap gap-space-sm text-xs">
            <div className="flex items-center bg-surface-container-lowest shadow-sm rounded-lg p-1 text-on-surface-variant border border-surface-container-high/30">
              <button
                onClick={() => setTimeframe("month")}
                className={`px-2.5 py-1 text-label-md font-label-md rounded transition-all ${
                  timeframe === "month"
                    ? "text-on-surface bg-surface-container-low font-semibold shadow-xs"
                    : "hover:text-on-surface"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeframe("quarter")}
                className={`px-2.5 py-1 text-label-md font-label-md rounded transition-all ${
                  timeframe === "quarter"
                    ? "text-on-surface bg-surface-container-low font-semibold shadow-xs"
                    : "hover:text-on-surface"
                }`}
              >
                Q3 Cumulative
              </button>
            </div>

            <button
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-all border border-surface-container-high/30 font-medium"
              type="button"
            >
              <Download size={16} />
              <span>Export Directory</span>
            </button>

            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all font-semibold"
              type="button"
            >
              <PlusCircle size={16} />
              <span>+ Add Customer</span>
            </button>
          </div>
        </div>

        {/* Top KPI Telemetry Cards (4-column grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1: Total Customers */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Total Customers
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-low text-primary">
                <Building2 size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                186
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="inline-flex items-center text-label-sm font-label-sm px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[11px]">
                  <ArrowUp size={12} className="mr-0.5" />
                  +10.7%
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  +18 net additions
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full w-[82%] rounded-full" />
            </div>
          </div>

          {/* Card 2: Active Accounts */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Active Accounts
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-low text-emerald-700">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                172
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="inline-flex items-center text-label-sm font-label-sm px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[11px]">
                  92.4% Health
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Live billing contracts
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-600 h-full w-[92.4%] rounded-full" />
            </div>
          </div>

          {/* Card 3: New This Month */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                New This Month
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-low text-secondary">
                <Rocket size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                18
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
                  ₹4,80,000
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  ARR pipeline
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-secondary-container h-full w-[65%] rounded-full" />
            </div>
          </div>

          {/* Card 4: Outstanding AR Risk */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-[11px] font-semibold">
                Outstanding AR Risk
              </span>
              <span className="p-1.5 rounded-lg bg-error-container/40 text-error">
                <AlertTriangle size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="font-mono-data-lg text-mono-data-lg text-error font-semibold tracking-tight text-2xl">
                9 Accounts
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="font-mono-data-sm text-mono-data-sm text-error font-semibold">
                  ₹85,000
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Dunning active
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-error h-full w-[28%] rounded-full" />
            </div>
          </div>
        </div>

        {/* Search & Segment Filters Bar */}
        <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm border border-surface-container-high/30">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[280px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-xs"
              placeholder="Search by company, POC name, GSTIN, or email..."
              type="text"
            />
          </div>

          {/* Tabs & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Badges Filter */}
            <div className="flex items-center bg-surface-container-low rounded-lg p-1 text-on-surface-variant">
              {[
                { id: "all", label: "All", count: 186 },
                { id: "active", label: "Active", count: 172 },
                { id: "onboarding", label: "Onboarding", count: 5 },
                { id: "at_risk", label: "At Risk", count: 9, isError: true },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 text-label-sm font-label-sm rounded-md transition-all ${
                    statusFilter === tab.id
                      ? "bg-surface-container-lowest text-on-surface shadow-xs font-semibold"
                      : tab.isError
                      ? "text-error hover:text-error/80"
                      : "hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 font-mono-data-sm text-[11px] opacity-80">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Segment Selector */}
            <div className="relative inline-block text-left">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="flex items-center h-9 px-3 pr-8 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-all appearance-none cursor-pointer border border-surface-container-high/20 text-xs"
              >
                <option value="all">Tier: All Tiers</option>
                <option value="enterprise">Tier: Enterprise &amp; Mid</option>
                <option value="trial">Tier: Sandbox Pro</option>
                <option value="setup">Tier: Setup Stage</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-3 text-on-surface-variant"
              />
            </div>

            {/* GST Status Filter */}
            <button
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-all border border-surface-container-high/20"
              type="button"
            >
              <SlidersHorizontal size={14} className="text-on-surface-variant" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Main Split Layout: Table (8 cols) + Selected Customer Profile Inspector (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Left Column: High-Density Institutional Customers Table (8 cols / ~66%) */}
          <div
            className={`${
              isDrawerOpen ? "lg:col-span-8" : "lg:col-span-12"
            } bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-container-high/30 transition-all`}
          >
            <DataTable
              columns={columns}
              data={filteredCustomers}
              keyExtractor={(c) => c.id}
              selectable={true}
              selectedIds={selectedCustomer ? [selectedCustomer.id] : []}
              onRowClick={(c) => {
                setSelectedCustomerId(c.id);
                setIsDrawerOpen(true);
              }}
              pageSize={10}
            />
          </div>

          {/* Right Column: Selected Customer Profile Inspector Drawer (4 cols / ~34%) */}
          {isDrawerOpen && selectedCustomer && (
            <div className="lg:col-span-4 space-y-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md border border-surface-container-high/30">
                {/* Inspector Card Header with Logo & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-sm ${selectedMeta.colorClass}`}
                    >
                      {selectedMeta.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold text-base">
                          {selectedCustomer.company_name || selectedCustomer.name}
                        </h3>
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5 text-xs">
                        <MapPin size={13} className="text-on-surface-variant flex-shrink-0" />
                        <span>
                          {selectedAddress.line1
                            ? `${selectedAddress.line1}, ${selectedAddress.city || "Bengaluru"}, ${selectedAddress.state || "KA"}`
                            : "JP Nagar 4th Phase, Bengaluru, KA"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                    title="Close Inspector"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Risk Callout Alert Banner (if overdue) */}
                {selectedMeta.overdue > 0 && (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-900 flex items-start gap-2.5 border border-red-200">
                    <AlertCircle size={20} className="text-error flex-shrink-0 mt-0.5" />
                    <div className="text-[12px] leading-snug">
                      <div className="font-semibold text-error">
                        At Risk (Dunning Stage 2)
                      </div>
                      <p className="text-error/80 mt-0.5">
                        Invoice #{selectedMeta.overdueInvoiceRef || "INV-2024-0890"} is{" "}
                        {selectedMeta.overdueDays || 18} days overdue. Automated retry scheduled for tomorrow.
                      </p>
                    </div>
                  </div>
                )}

                {/* Compliance & Regulatory Grid */}
                <div className="bg-surface-container-low rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[11px]">
                      GSTIN (Active)
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold select-all">
                      {selectedMeta.gstin}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[11px]">
                      Corporate PAN
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold select-all">
                      {selectedMeta.pan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[11px]">
                      Tax Residency
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {selectedMeta.residency}
                    </span>
                  </div>
                </div>

                {/* Financial Health Matrix (3 KPI Chips) */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-container-low rounded-lg p-2.5 text-center">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px] font-medium">
                      Total LTV
                    </div>
                    <div className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold mt-1 text-xs">
                      {formatINR(selectedMeta.ltv)}
                    </div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-2.5 text-center">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px] font-medium">
                      Active MRR
                    </div>
                    <div className="font-mono-data-sm text-mono-data-sm text-on-surface font-semibold mt-1 text-xs">
                      {formatINR(selectedMeta.mrr)}
                    </div>
                  </div>
                  <div
                    className={`${
                      selectedMeta.overdue > 0 ? "bg-red-50" : "bg-surface-container-low"
                    } rounded-lg p-2.5 text-center`}
                  >
                    <div
                      className={`font-label-sm text-label-sm uppercase text-[10px] font-medium ${
                        selectedMeta.overdue > 0 ? "text-error" : "text-on-surface-variant"
                      }`}
                    >
                      Overdue
                    </div>
                    <div
                      className={`font-mono-data-sm text-mono-data-sm font-semibold mt-1 text-xs ${
                        selectedMeta.overdue > 0 ? "text-error" : "text-on-surface"
                      }`}
                    >
                      {formatINR(selectedMeta.overdue)}
                    </div>
                  </div>
                </div>

                {/* Primary Billing Contact Details */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                      Primary FinOps POC
                    </span>
                    <button className="font-label-sm text-label-sm text-primary hover:underline font-medium">
                      Change
                    </button>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container-low">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {selectedCustomer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-label-md text-label-md text-on-surface font-medium text-xs">
                        {selectedCustomer.name}
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
                        {selectedMeta.pocRole}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                        <span className="font-mono-data-sm text-mono-data-sm truncate">
                          {selectedCustomer.email}
                        </span>
                        <span>•</span>
                        <span className="font-mono-data-sm text-mono-data-sm">
                          {selectedCustomer.phone || "+91 98450 12890"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscribed Tier Plan & SLA */}
                <div className="space-y-2 text-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                    Current Plan &amp; SLA
                  </span>
                  <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Cpu size={20} className="text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-label-md text-label-md text-on-surface font-medium truncate text-xs">
                          {selectedMeta.tierName}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
                          {selectedMeta.tierSla}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-label-sm text-label-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[10px]">
                        {selectedMeta.renewal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Institutional Action Buttons */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-error text-on-error font-label-md text-label-md hover:bg-error/90 transition-all shadow-xs font-semibold"
                      type="button"
                    >
                      <BellRing size={15} />
                      <span>Send Notice</span>
                    </button>
                    <Link
                      href="/invoices"
                      className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-all font-medium border border-surface-container-high/30"
                    >
                      <Receipt size={15} />
                      <span>View Invoices</span>
                    </Link>
                  </div>
                  <button
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-all font-medium border border-surface-container-high/30"
                    type="button"
                  >
                    <FileEdit size={15} />
                    <span>Edit Company Account</span>
                  </button>
                </div>

                {/* Recent Invoices Mini Telemetry List */}
                <div className="space-y-2 pt-2 border-t border-surface-container-high/40 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-[11px]">
                      Recent Ledger Activity
                    </span>
                    <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
                      Last 3
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {customerInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className={`p-2 rounded-lg flex items-center justify-between ${
                          inv.isOverdue ? "bg-red-50/60" : "bg-surface-container-low"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {inv.isOverdue ? (
                            <Clock size={16} className="text-error flex-shrink-0" />
                          ) : (
                            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium text-xs">
                              {inv.invoice_number}
                            </div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant text-[10px]">
                              {inv.due_date.startsWith("Due") || inv.due_date.startsWith("Paid")
                                ? inv.due_date
                                : `Date: ${inv.due_date}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-mono-data-sm text-mono-data-sm font-semibold text-xs ${
                              inv.isOverdue ? "text-error" : "text-on-surface"
                            }`}
                          >
                            {formatINR(inv.amount)}
                          </div>
                          <span
                            className={`font-label-sm text-label-sm uppercase text-[10px] font-semibold ${
                              inv.isOverdue ? "text-error" : "text-emerald-700"
                            }`}
                          >
                            {inv.statusLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Indian GST Audit Verification Banner */}
              <div className="p-3 rounded-xl bg-surface-container-high/50 shadow-sm flex items-center justify-between border border-surface-container-high/30">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className="text-primary flex-shrink-0" />
                  <div>
                    <div className="font-label-md text-label-md text-on-surface font-medium text-xs">
                      GST e-Invoicing Compliance
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      NIC Portal synced 2 hours ago. IRN auto-generation active.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm shadow-xs hover:bg-surface-container transition-all font-semibold text-xs border border-surface-container-high/30"
                >
                  Verify
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
