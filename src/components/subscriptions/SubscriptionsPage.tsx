"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Download,
  PlusCircle,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUp,
  TrendingUp,
  Calendar,
  ChevronDown,
  MoreVertical,
  X,
  FileText,
  FileEdit,
  Building2,
  Users,
  Cloud,
  Headphones,
  ShieldCheck,
  RefreshCw,
  Receipt,
  Check,
  Eye,
  CreditCard,
} from "lucide-react";
import {
  mockSubscriptions,
  mockCustomers,
  mockPlans,
  mockInvoices,
} from "@/lib/mock-data";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";

export interface SubscriptionLineItem {
  title: string;
  detail: string;
  icon: "users" | "cloud" | "tam" | "shield";
}

export interface SubscriptionInvoiceRecord {
  invoice_no: string;
  method: string;
  date: string;
  amount: string;
  paid: boolean;
}

export interface SubscriptionDisplayItem {
  id: string;
  code: string;
  customer_id: string;
  customer_name: string;
  customer_company: string;
  customer_contact: string;
  customer_initials: string;
  billing_account_id: string;
  plan_id: string;
  plan_name: string;
  plan_tier_label: string;
  billing_cycle: "Monthly" | "Yearly" | "Multi-Year";
  timeline_next: string;
  timeline_from: string;
  amount: number;
  amount_formatted: string;
  amount_cadence: string;
  status:
    | "active"
    | "trial"
    | "confirmed"
    | "quotation"
    | "draft"
    | "paused"
    | "closed";
  mandate_bank: string;
  mandate_last4: string;
  mandate_type: string;
  mandate_verified: boolean;
  line_items: SubscriptionLineItem[];
  recent_invoices: SubscriptionInvoiceRecord[];
  auto_renew: boolean;
}

// Rich Indian B2B Initial dataset matching the Stitch design
const INITIAL_SUBSCRIPTIONS: SubscriptionDisplayItem[] = [
  {
    id: "sub-001",
    code: "SUB-2024-1049",
    customer_id: "cust-001",
    customer_name: "Priya Nair",
    customer_company: "Zoho Tech Pvt Ltd",
    customer_contact: "Priya Nair (FinOps)",
    customer_initials: "ZT",
    billing_account_id: "AC-9081",
    plan_id: "plan-004",
    plan_name: "Enterprise Suite",
    plan_tier_label: "50 Seats + 500GB SLA",
    billing_cycle: "Yearly",
    timeline_next: "12 Jan 2025",
    timeline_from: "12 Jan 2024",
    amount: 120000,
    amount_formatted: "₹1,20,000",
    amount_cadence: "per year",
    status: "active",
    mandate_bank: "HDFC Bank e-Mandate",
    mandate_last4: "8821",
    mandate_type: "NACH Autopay",
    mandate_verified: true,
    line_items: [
      {
        title: "Seat Licenses (Tier 1)",
        detail: "50 Seats",
        icon: "users",
      },
      {
        title: "Cloud Storage Add-on",
        detail: "500 GB Encrypted",
        icon: "cloud",
      },
      {
        title: "Dedicated FinOps TAM",
        detail: "24/7 SLA (Tier 1)",
        icon: "tam",
      },
    ],
    recent_invoices: [
      {
        invoice_no: "INV-2024-001",
        method: "Paid via e-Mandate",
        date: "12 Jan 2024",
        amount: "₹1,20,000",
        paid: true,
      },
      {
        invoice_no: "INV-2023-112",
        method: "Paid via Bank Transfer",
        date: "12 Jan 2023",
        amount: "₹1,05,000",
        paid: true,
      },
    ],
    auto_renew: true,
  },
  {
    id: "sub-002",
    code: "SUB-2024-1048",
    customer_id: "cust-002",
    customer_name: "Amit Patel",
    customer_company: "FreshWorks Solutions",
    customer_contact: "Amit Patel (CTO)",
    customer_initials: "FS",
    billing_account_id: "AC-7742",
    plan_id: "plan-003",
    plan_name: "Pro Scale",
    plan_tier_label: "25 Seats + Realtime Telemetry",
    billing_cycle: "Monthly",
    timeline_next: "20 Nov 2024",
    timeline_from: "20 Apr 2024",
    amount: 14500,
    amount_formatted: "₹14,500",
    amount_cadence: "per month",
    status: "active",
    mandate_bank: "ICICI Corporate e-Mandate",
    mandate_last4: "4410",
    mandate_type: "e-Mandate Direct Debit",
    mandate_verified: true,
    line_items: [
      {
        title: "Pro Core Licenses",
        detail: "25 Seats",
        icon: "users",
      },
      {
        title: "Telemetry & Logs Export",
        detail: "Real-time Kafka Stream",
        icon: "cloud",
      },
    ],
    recent_invoices: [
      {
        invoice_no: "INV-2024-108",
        method: "Paid via ICICI Autopay",
        date: "20 Oct 2024",
        amount: "₹14,500",
        paid: true,
      },
    ],
    auto_renew: true,
  },
  {
    id: "sub-003",
    code: "SUB-2024-1047",
    customer_id: "cust-003",
    customer_name: "Sunita Rao",
    customer_company: "Razorpay Digital Labs",
    customer_contact: "Sunita Rao (VP Eng)",
    customer_initials: "RD",
    billing_account_id: "AC-3109",
    plan_id: "plan-001",
    plan_name: "Starter Cloud",
    plan_tier_label: "5 Seats + API Access",
    billing_cycle: "Monthly",
    timeline_next: "15 Nov 2024",
    timeline_from: "01 Nov 2024",
    amount: 2999,
    amount_formatted: "₹2,999",
    amount_cadence: "per month",
    status: "trial",
    mandate_bank: "Axis Bank UPI Autopay",
    mandate_last4: "9012",
    mandate_type: "UPI Recurring Mandate",
    mandate_verified: true,
    line_items: [
      {
        title: "Developer Seat Plan",
        detail: "5 Seats Active",
        icon: "users",
      },
      {
        title: "Full API Playground",
        detail: "10k calls/day",
        icon: "cloud",
      },
    ],
    recent_invoices: [
      {
        invoice_no: "INV-2024-099",
        method: "Trial Authorization ₹2 Auth",
        date: "01 Nov 2024",
        amount: "₹2",
        paid: true,
      },
    ],
    auto_renew: true,
  },
  {
    id: "sub-004",
    code: "SUB-2024-1046",
    customer_id: "cust-004",
    customer_name: "Rajesh Kumar",
    customer_company: "Reliance Retail Ent.",
    customer_contact: "Rajesh Kumar (Director)",
    customer_initials: "RR",
    billing_account_id: "AC-1002",
    plan_id: "plan-004",
    plan_name: "Enterprise Custom",
    plan_tier_label: "200 Seats + Dedicated Cloud",
    billing_cycle: "Yearly",
    timeline_next: "01 Jul 2025",
    timeline_from: "01 Jul 2024",
    amount: 480000,
    amount_formatted: "₹4,80,000",
    amount_cadence: "per year",
    status: "active",
    mandate_bank: "State Bank of India Commercial",
    mandate_last4: "6732",
    mandate_type: "NACH Physical Mandate",
    mandate_verified: true,
    line_items: [
      {
        title: "Enterprise Global Licenses",
        detail: "200 Seats",
        icon: "users",
      },
      {
        title: "Dedicated AWS VPC Cluster",
        detail: "Multi-AZ High Availability",
        icon: "cloud",
      },
      {
        title: "Executive TAM Support",
        detail: "15 min SLA Response",
        icon: "tam",
      },
    ],
    recent_invoices: [
      {
        invoice_no: "INV-2024-054",
        method: "Paid via SBI RTGS",
        date: "01 Jul 2024",
        amount: "₹4,80,000",
        paid: true,
      },
    ],
    auto_renew: true,
  },
  {
    id: "sub-005",
    code: "SUB-2024-1045",
    customer_id: "cust-005",
    customer_name: "Rohan Verma",
    customer_company: "Cred FinTech Pvt Ltd",
    customer_contact: "Rohan Verma (Lead Ops)",
    customer_initials: "CF",
    billing_account_id: "AC-5591",
    plan_id: "plan-003",
    plan_name: "Pro Scale",
    plan_tier_label: "15 Seats + Compliance",
    billing_cycle: "Monthly",
    timeline_next: "Paused (Manual Hold)",
    timeline_from: "20 Oct 2024",
    amount: 8999,
    amount_formatted: "₹8,999",
    amount_cadence: "per month",
    status: "paused",
    mandate_bank: "Kotak Mahindra e-Mandate",
    mandate_last4: "1120",
    mandate_type: "NACH Autopay",
    mandate_verified: true,
    line_items: [
      {
        title: "Pro Compliance Licenses",
        detail: "15 Seats (Hold)",
        icon: "users",
      },
    ],
    recent_invoices: [
      {
        invoice_no: "INV-2024-082",
        method: "Paid via Kotak Autopay",
        date: "20 Sep 2024",
        amount: "₹8,999",
        paid: true,
      },
    ],
    auto_renew: false,
  },
  {
    id: "sub-006",
    code: "SUB-2024-1044",
    customer_id: "cust-006",
    customer_name: "Ananya Sen",
    customer_company: "Flipkart Supply Chain",
    customer_contact: "Ananya Sen (Logistics VP)",
    customer_initials: "FS",
    billing_account_id: "AC-4482",
    plan_id: "plan-002",
    plan_name: "Growth Tier",
    plan_tier_label: "40 Seats + High SLA",
    billing_cycle: "Yearly",
    timeline_next: "Terminated / Closed",
    timeline_from: "01 Jan 2024",
    amount: 96000,
    amount_formatted: "₹96,000",
    amount_cadence: "per year",
    status: "closed",
    mandate_bank: "HDFC Corporate NetBanking",
    mandate_last4: "5567",
    mandate_type: "Cancelled Mandate",
    mandate_verified: false,
    line_items: [
      {
        title: "Growth Tier Licenses",
        detail: "40 Seats Archival",
        icon: "users",
      },
    ],
    recent_invoices: [
      {
        invoice_no: "INV-2024-002",
        method: "Final Settlement Paid",
        date: "01 Sep 2024",
        amount: "₹96,000",
        paid: true,
      },
    ],
    auto_renew: false,
  },
  {
    id: "sub-007",
    code: "SUB-2024-1043",
    customer_id: "cust-007",
    customer_name: "Vikram Singh",
    customer_company: "Tata Digital Systems",
    customer_contact: "Vikram Singh (Security)",
    customer_initials: "TD",
    billing_account_id: "AC-8833",
    plan_id: "plan-001",
    plan_name: "Starter Cloud",
    plan_tier_label: "10 Seats + Dedicated IP",
    billing_cycle: "Monthly",
    timeline_next: "05 Dec 2024",
    timeline_from: "05 Sep 2024",
    amount: 4999,
    amount_formatted: "₹4,999",
    amount_cadence: "per month",
    status: "confirmed",
    mandate_bank: "Bank of Baroda e-Mandate",
    mandate_last4: "2209",
    mandate_type: "e-Mandate Direct Debit",
    mandate_verified: true,
    line_items: [
      {
        title: "Standard Cloud Tier",
        detail: "10 Seats",
        icon: "users",
      },
      {
        title: "Static Whitelisted IP",
        detail: "1 IPv4 Allocation",
        icon: "shield",
      },
    ],
    recent_invoices: [
      {
        invoice_no: "INV-2024-071",
        method: "Paid via BoB Autopay",
        date: "05 Nov 2024",
        amount: "₹4,999",
        paid: true,
      },
    ],
    auto_renew: true,
  },
  {
    id: "sub-008",
    code: "SUB-2024-1042",
    customer_id: "cust-008",
    customer_name: "Meera Joshi",
    customer_company: "Paytm Payments Bank",
    customer_contact: "Meera Joshi (Lead Dev)",
    customer_initials: "PP",
    billing_account_id: "AC-2231",
    plan_id: "plan-001",
    plan_name: "Starter Cloud",
    plan_tier_label: "3 Seats Trial",
    billing_cycle: "Monthly",
    timeline_next: "Awaiting Order Sign-off",
    timeline_from: "28 Oct 2024",
    amount: 1499,
    amount_formatted: "₹1,499",
    amount_cadence: "per month",
    status: "draft",
    mandate_bank: "UPI AutoPay Pending",
    mandate_last4: "3381",
    mandate_type: "Pending OTP Validation",
    mandate_verified: false,
    line_items: [
      {
        title: "Sandbox Developer Seat",
        detail: "3 Seats",
        icon: "users",
      },
    ],
    recent_invoices: [
      {
        invoice_no: "INV-2024-DRAFT",
        method: "Proforma Invoice Draft",
        date: "28 Oct 2024",
        amount: "₹1,499",
        paid: false,
      },
    ],
    auto_renew: false,
  },
];

export function SubscriptionsPage() {
  // Merge mockSubscriptions from mockData with our rich display records
  const initialData = useMemo(() => {
    // If mockSubscriptions has entries, correlate them or append
    return INITIAL_SUBSCRIPTIONS.map((item, index) => {
      const mockRow = mockSubscriptions[index];
      if (!mockRow) return item;
      return {
        ...item,
        id: mockRow.id || item.id,
        status:
          mockRow.status === "active"
            ? "active"
            : mockRow.status === "paused"
            ? "paused"
            : mockRow.status === "closed"
            ? "closed"
            : mockRow.status === "confirmed"
            ? "confirmed"
            : mockRow.status === "draft"
            ? "draft"
            : item.status,
      };
    });
  }, []);

  const [subscriptionsList, setSubscriptionsList] =
    useState<SubscriptionDisplayItem[]>(initialData);
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionDisplayItem>(initialData[0]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Action notification helper
  const notifyAction = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Toggle Pause/Resume on currently selected subscription
  const handleTogglePause = () => {
    if (!selectedSubscription) return;
    const isCurrentlyPaused = selectedSubscription.status === "paused";
    const nextStatus: SubscriptionDisplayItem["status"] = isCurrentlyPaused
      ? "active"
      : "paused";

    const updated = {
      ...selectedSubscription,
      status: nextStatus,
      timeline_next: isCurrentlyPaused
        ? "12 Jan 2025"
        : "Paused (Manual Hold)",
    };

    setSelectedSubscription(updated);
    setSubscriptionsList((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );

    notifyAction(
      `Subscription ${updated.code} has been ${
        isCurrentlyPaused ? "resumed" : "paused"
      }.`
    );
  };

  // Toggle Auto-Renew Policy
  const handleToggleAutoRenew = () => {
    if (!selectedSubscription) return;
    const nextVal = !selectedSubscription.auto_renew;
    const updated = {
      ...selectedSubscription,
      auto_renew: nextVal,
    };
    setSelectedSubscription(updated);
    setSubscriptionsList((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    notifyAction(
      `Auto-renew policy ${nextVal ? "enabled" : "disabled"} for ${
        updated.code
      }.`
    );
  };

  // Filtered subscriptions based on tabs, search, and dropdowns
  const filteredSubscriptions = useMemo(() => {
    return subscriptionsList.filter((item) => {
      // Tab filter
      if (activeTab !== "all" && item.status !== activeTab) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesCompany = item.customer_company
          .toLowerCase()
          .includes(query);
        const matchesContact = item.customer_contact
          .toLowerCase()
          .includes(query);
        const matchesPlan = item.plan_name.toLowerCase().includes(query);
        if (
          !matchesCode &&
          !matchesCompany &&
          !matchesContact &&
          !matchesPlan
        ) {
          return false;
        }
      }

      // Plan filter
      if (planFilter !== "all") {
        if (
          planFilter === "enterprise" &&
          !item.plan_name.toLowerCase().includes("enterprise")
        )
          return false;
        if (
          planFilter === "pro" &&
          !item.plan_name.toLowerCase().includes("pro")
        )
          return false;
        if (
          planFilter === "starter" &&
          !item.plan_name.toLowerCase().includes("starter")
        )
          return false;
      }

      // Cycle filter
      if (cycleFilter !== "all") {
        if (
          cycleFilter === "monthly" &&
          item.billing_cycle.toLowerCase() !== "monthly"
        )
          return false;
        if (
          cycleFilter === "yearly" &&
          item.billing_cycle.toLowerCase() !== "yearly"
        )
          return false;
      }

      return true;
    });
  }, [subscriptionsList, activeTab, searchQuery, planFilter, cycleFilter]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: subscriptionsList.length,
      active: subscriptionsList.filter((s) => s.status === "active").length,
      trial: subscriptionsList.filter((s) => s.status === "trial").length,
      confirmed: subscriptionsList.filter((s) => s.status === "confirmed")
        .length,
      quotation: subscriptionsList.filter((s) => s.status === "quotation")
        .length,
      draft: subscriptionsList.filter((s) => s.status === "draft").length,
      closed: subscriptionsList.filter((s) => s.status === "closed").length,
    };
  }, [subscriptionsList]);

  // Selection handlers
  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    setSelectedIds((prev) =>
      prev.includes(strId)
        ? prev.filter((i) => i !== strId)
        : [...prev, strId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSubscriptions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubscriptions.map((s) => s.id));
    }
  };

  // Status Badge Renderer matching Stitch design
  const renderStatusBadge = (status: SubscriptionDisplayItem["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-[11px] font-semibold border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case "trial":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-label-sm text-[11px] font-semibold border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            In Trial
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-label-sm text-[11px] font-semibold border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Confirmed
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-label-sm text-[11px] font-semibold border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Paused
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-label-sm text-[11px] font-semibold border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Closed
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-label-sm text-[11px] font-semibold border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            Draft
          </span>
        );
    }
  };

  // DataTable column definitions
  const columns: ColumnDef<SubscriptionDisplayItem>[] = [
    {
      header: (
        <input
          type="checkbox"
          checked={
            filteredSubscriptions.length > 0 &&
            selectedIds.length === filteredSubscriptions.length
          }
          onChange={handleSelectAll}
          className="rounded w-4 h-4 text-primary bg-surface-container focus:ring-0 cursor-pointer"
        />
      ),
      className: "w-10 px-3 text-center",
      headerClassName: "w-10 px-3 text-center",
      cell: (item) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(item.id)}
          onChange={(e) => {
            e.stopPropagation();
            handleSelectRow(item.id);
          }}
          className="rounded w-4 h-4 text-primary bg-surface-container focus:ring-0 cursor-pointer"
        />
      ),
    },
    {
      header: "ID",
      cell: (item) => {
        const isSelected = selectedSubscription?.id === item.id;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono-data-sm text-mono-data-sm font-semibold ${
                isSelected ? "text-primary" : "text-on-surface"
              }`}
            >
              {item.code}
            </span>
            {item.status === "active" && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            )}
          </div>
        );
      },
    },
    {
      header: "Customer Entity",
      cell: (item) => (
        <div className="flex items-center gap-2.5 max-w-[200px]">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-mono-data-sm text-mono-data-sm font-bold flex-shrink-0">
            {item.customer_initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md text-on-surface font-semibold truncate text-xs">
              {item.customer_company}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-[11px]">
              {item.customer_contact}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Product & Tier",
      cell: (item) => (
        <div className="flex flex-col max-w-[180px]">
          <span className="font-label-md text-label-md text-on-surface font-medium text-xs truncate">
            {item.plan_name}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
            {item.plan_tier_label}
          </span>
        </div>
      ),
    },
    {
      header: "Cycle",
      cell: (item) => (
        <span className="px-2 py-0.5 rounded bg-surface-container font-mono-data-sm text-mono-data-sm text-on-surface text-xs font-medium">
          {item.billing_cycle}
        </span>
      ),
    },
    {
      header: "Billing Timeline",
      cell: (item) => (
        <div className="flex flex-col font-mono-data-sm text-[11px]">
          <span className="text-on-surface font-medium">
            Next: {item.timeline_next}
          </span>
          <span className="text-on-surface-variant text-[10px]">
            From: {item.timeline_from}
          </span>
        </div>
      ),
    },
    {
      header: "Amount",
      align: "right",
      cell: (item) => (
        <div className="flex flex-col text-right">
          <span className="font-mono-data-md text-mono-data-md font-semibold text-on-surface text-xs">
            {item.amount_formatted}
          </span>
          <div className="text-[10px] text-on-surface-variant font-mono-data-sm">
            {item.amount_cadence}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (item) => (
        <div className="flex justify-center">
          {renderStatusBadge(item.status)}
        </div>
      ),
    },
    {
      header: "",
      className: "w-10 px-3 text-center",
      cell: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSubscription(item);
            setIsInspectorOpen(true);
          }}
          className="p-1 hover:bg-surface-container rounded-md text-on-surface-variant hover:text-on-surface transition-colors"
          title="Inspect Subscription"
        >
          <MoreVertical size={16} />
        </button>
      ),
    },
  ];

  return (
    <main className="w-full pt-4 flex-1 px-4 sm:px-6 py-6 bg-surface">
      <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
        {/* Notification Toast */}
        {successMessage && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-body-sm text-body-sm flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-primary/70 hover:text-primary"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-data-sm text-mono-data-sm text-primary uppercase font-semibold tracking-wider text-xs">
                Recurring Ops
              </span>
              <span className="text-on-surface-variant/40">/</span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant font-medium text-xs">
                Lifecycle Orchestration
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold text-2xl sm:text-3xl">
              Subscriptions
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Manage recurring subscriptions, renewals, customer contracts, and lifecycle statuses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex items-center">
              <Search
                size={16}
                className="absolute left-3 text-on-surface-variant"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by subscription ID, customer..."
                className="w-64 md:w-72 h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/60 transition-all text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => notifyAction("Filter configuration updated.")}
              className="h-10 px-3.5 flex items-center gap-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm border border-surface-container-high/60 transition-all text-xs font-medium"
            >
              <SlidersHorizontal size={16} className="text-on-surface-variant" />
              <span>Filter</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5"></span>
            </button>

            <button
              type="button"
              onClick={() =>
                notifyAction("Exporting subscriptions data to CSV...")
              }
              className="h-10 px-3.5 flex items-center gap-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm border border-surface-container-high/60 transition-all text-xs font-medium"
            >
              <Download size={16} className="text-on-surface-variant" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() =>
                notifyAction("Subscription creation workflow launched.")
              }
              className="h-10 px-4 flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-label-md text-label-md shadow-sm transition-all text-xs font-medium"
            >
              <PlusCircle size={16} />
              <span>Create Subscription</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                Total Subscriptions
              </span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Award size={18} />
              </div>
            </div>
            <div className="mt-3 mb-1 flex items-baseline gap-2">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                284
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant font-medium text-xs">
                contracts
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm mt-1 text-xs">
              <span className="inline-flex items-center text-emerald-600 font-mono-data-sm font-semibold">
                <ArrowUp size={12} />+18
              </span>
              <span className="text-on-surface-variant/80">
                this month • All-time recorded
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                Active Recurring
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3 mb-1 flex items-baseline gap-2">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                248
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-emerald-600 font-medium text-xs">
                87.3% share
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm mt-1">
              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: "87.3%" }}
                ></div>
              </div>
            </div>
            <div className="text-on-surface-variant/80 font-body-sm text-[11px] mt-1">
              Generating active telemetry billing
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                In Trial Pipeline
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3 mb-1 flex items-baseline gap-2">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                24
              </span>
              <span className="inline-flex items-center text-amber-600 font-mono-data-sm font-semibold text-xs">
                <TrendingUp size={12} className="mr-0.5" />+6
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-[11px] mt-1">
              <span>Avg duration: 14 days</span>
              <span className="font-mono-data-sm font-medium text-amber-700">
                78% conv.
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                Cancelled / Churned
              </span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="mt-3 mb-1 flex items-baseline gap-2">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                12
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-rose-600 font-medium text-xs">
                2.1% churn
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-[11px] mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Target benchmark: &lt;3.0% (Safe)</span>
            </div>
          </div>
        </div>

        {/* Filter Pills and Sub-controls Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-surface-container-high/50">
          {/* Status Tabs */}
          <div className="flex items-center overflow-x-auto gap-1 pb-1 lg:pb-0">
            {[
              { id: "all", label: "All", count: tabCounts.all },
              { id: "active", label: "Active", count: tabCounts.active },
              { id: "trial", label: "Trial", count: tabCounts.trial },
              { id: "confirmed", label: "Confirmed", count: tabCounts.confirmed },
              { id: "quotation", label: "Quotation", count: tabCounts.quotation },
              { id: "draft", label: "Draft", count: tabCounts.draft },
              { id: "closed", label: "Closed", count: tabCounts.closed },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-xs whitespace-nowrap transition-colors flex items-center ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-md font-mono-data-sm text-[10px] ${
                      isActive ? "bg-white/20" : "bg-surface-container"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub Filter Dropdowns & Batch Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto text-xs">
            <div className="flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 gap-1.5 border border-surface-container-high/40">
              <Calendar size={14} className="text-on-surface-variant" />
              <span className="font-body-sm text-on-surface font-medium">
                CY 2024–2025
              </span>
            </div>

            <div className="flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 gap-1 border border-surface-container-high/40">
              <span className="text-on-surface-variant">Plan:</span>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                aria-label="Filter by subscription plan tier"
                className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">All Tiers</option>
                <option value="starter">Starter Cloud</option>
                <option value="pro">Pro Scale</option>
                <option value="enterprise">Enterprise Custom</option>
              </select>
            </div>

            <div className="flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 gap-1 border border-surface-container-high/40">
              <span className="text-on-surface-variant">Cycle:</span>
              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
                aria-label="Filter by billing cadence cycle"
                className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">All Cycles</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="h-5 w-px bg-surface-container-high mx-1 hidden sm:block"></div>

            <button
              type="button"
              onClick={() => {
                if (selectedIds.length === 0) {
                  notifyAction("Please select subscriptions from the table.");
                  return;
                }
                notifyAction(
                  `Batch pause requested for ${selectedIds.length} subscriptions.`
                );
              }}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm uppercase tracking-wide font-medium border border-surface-container-high/40 transition-colors"
            >
              Pause Selected
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedIds.length === 0) {
                  notifyAction("Please select subscriptions from the table.");
                  return;
                }
                notifyAction(
                  `Notice broadcast dispatched to ${selectedIds.length} customers.`
                );
              }}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm uppercase tracking-wide font-medium border border-surface-container-high/40 transition-colors"
            >
              Send Notice
            </button>
          </div>
        </div>

        {/* Main Content Split: Data Grid + Detail Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table Container */}
          <div
            className={`${
              isInspectorOpen ? "lg:col-span-8" : "lg:col-span-12"
            } flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/50 overflow-hidden transition-all`}
          >
            <DataTable
              columns={columns}
              data={filteredSubscriptions}
              keyExtractor={(item) => item.id}
              selectable={false}
              selectedIds={selectedSubscription ? [selectedSubscription.id] : []}
              onRowClick={(item) => {
                setSelectedSubscription(item);
                setIsInspectorOpen(true);
              }}
              pageSize={10}
              searchPlaceholder="Filter subscriptions..."
            />
          </div>

          {/* Right Column: Detail Inspector Drawer */}
          {isInspectorOpen && selectedSubscription && (
            <div className="lg:col-span-4 flex flex-col bg-surface-container-lowest rounded-xl shadow-md border border-surface-container-high/60 overflow-hidden relative transition-all">
              {/* Drawer Top Header */}
              <div className="p-5 bg-surface-container-low/50 flex flex-col gap-3 border-b border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data-md text-mono-data-md font-bold text-primary text-sm">
                      {selectedSubscription.code}
                    </span>
                    {renderStatusBadge(selectedSubscription.status)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        notifyAction(
                          `Downloading contract agreement for ${selectedSubscription.code}...`
                        )
                      }
                      className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-md transition-colors"
                      title="Download Agreement"
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      onClick={() =>
                        notifyAction(
                          `Opening editor for ${selectedSubscription.code}`
                        )
                      }
                      className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-md transition-colors"
                      title="Edit Subscription"
                    >
                      <FileEdit size={16} />
                    </button>
                    <button
                      onClick={() => setIsInspectorOpen(false)}
                      className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-md transition-colors"
                      title="Close Panel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Customer Info Card */}
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground font-mono-data-lg font-bold flex items-center justify-center shadow-sm text-base">
                    {selectedSubscription.customer_initials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate leading-snug text-sm">
                      {selectedSubscription.customer_company}
                    </h3>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                      {selectedSubscription.customer_contact} • #
                      {selectedSubscription.billing_account_id}
                    </span>
                  </div>
                </div>

                {/* Contract Value & Renewal Date Grid */}
                <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-surface-container-high/40 font-body-sm">
                  <div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px] font-semibold tracking-wider">
                      Contract Value
                    </div>
                    <div className="font-mono-data-md text-mono-data-md font-bold text-on-surface text-sm mt-0.5">
                      {selectedSubscription.amount_formatted}
                      <span className="text-[11px] font-normal text-on-surface-variant">
                        {" "}
                        /{selectedSubscription.billing_cycle === "Yearly" ? "yr" : "mo"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px] font-semibold tracking-wider">
                      Renewal Date
                    </div>
                    <div className="font-mono-data-md text-mono-data-md font-bold text-emerald-600 text-sm mt-0.5">
                      {selectedSubscription.timeline_next}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Detail Body */}
              <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-320px)]">
                {/* Configured Line Items */}
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                    Configured Line Items
                  </span>
                  <div className="bg-surface-container-low rounded-lg p-3 space-y-2.5 border border-surface-container-high/40">
                    {selectedSubscription.line_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 text-on-surface">
                          {item.icon === "cloud" ? (
                            <Cloud size={14} className="text-primary" />
                          ) : item.icon === "tam" ? (
                            <Headphones size={14} className="text-primary" />
                          ) : item.icon === "shield" ? (
                            <ShieldCheck size={14} className="text-primary" />
                          ) : (
                            <Users size={14} className="text-primary" />
                          )}
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <span className="font-mono-data-sm text-on-surface-variant font-semibold">
                          {item.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Instrumentation */}
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                    Payment Instrumentation
                  </span>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-surface-container-high/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center shadow-sm text-primary">
                        <Building2 size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface text-xs">
                          {selectedSubscription.mandate_bank}
                        </span>
                        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-[11px]">
                          {selectedSubscription.mandate_type} • ****{" "}
                          {selectedSubscription.mandate_last4}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-emerald-700 font-mono-data-sm text-[10px] font-semibold">
                      {selectedSubscription.mandate_verified
                        ? "Verified"
                        : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Invoicing Ledger */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                      Invoicing Ledger
                    </span>
                    <Link
                      href="/invoices"
                      className="font-label-sm text-label-sm text-primary hover:underline font-semibold text-xs"
                    >
                      All Invoices
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    {selectedSubscription.recent_invoices.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-container-high/30"
                      >
                        <div className="flex flex-col">
                          <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface text-xs">
                            {inv.invoice_no}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                            {inv.method} • {inv.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-data-sm text-mono-data-sm font-semibold text-on-surface text-xs">
                            {inv.amount}
                          </span>
                          {inv.paid ? (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-600"
                            />
                          ) : (
                            <Clock size={14} className="text-amber-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auto-Renew Policy Toggle */}
                <div className="p-3.5 rounded-xl bg-surface-container-low/70 flex items-center justify-between border border-surface-container-high/40">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={18} className="text-primary" />
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-semibold text-on-surface text-xs">
                        Auto-Renew Policy
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                        {selectedSubscription.auto_renew
                          ? "Triggers renewal notice 30 days prior"
                          : "Manual renewal required at term expiry"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAutoRenew}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      selectedSubscription.auto_renew
                        ? "bg-primary justify-end"
                        : "bg-surface-container-high justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                  </button>
                </div>
              </div>

              {/* Inspector Footer Actions */}
              <div className="p-4 bg-surface-container-low/70 flex items-center justify-between gap-3 border-t border-surface-container-high/40">
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="w-1/2 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm border border-surface-container-high/50 transition-all text-center text-xs font-semibold"
                >
                  {selectedSubscription.status === "paused"
                    ? "Resume Billing"
                    : "Pause Billing"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    notifyAction(
                      `Upgrade catalog modal triggered for ${selectedSubscription.code}`
                    )
                  }
                  className="w-1/2 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-label-md text-label-md shadow-sm transition-all text-center text-xs font-semibold"
                >
                  Upgrade Tier
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom 3 B2B Enterprise Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              <ShieldCheck size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                RBI e-Mandate Compliant
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-relaxed">
                Automated recurring debits with certified Pre-Debit SMS notifications.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-600">
              <RefreshCw size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                Smart Dunning Engine
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-relaxed">
                Intelligent retries recover up to 42% of failed Indian corporate cards.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-600">
              <Receipt size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                GST Billing &amp; Invoicing
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-relaxed">
                Auto-generated B2B e-Invoices with real-time IRN and QR validation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

