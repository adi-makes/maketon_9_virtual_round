"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronRight,
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
  AlertCircle,
  Inbox,
  Ban,
} from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import {
  getSubscriptions,
  transitionSubscriptionStatus,
  toggleCancelAtPeriodEnd,
  type SubscriptionDisplayItem,
  type SubscriptionLineItem,
  type SubscriptionInvoiceRecord,
} from "@/actions/subscriptions";

export type {
  SubscriptionDisplayItem,
  SubscriptionLineItem,
  SubscriptionInvoiceRecord,
};

export interface SubscriptionsPageProps {
  initialSubscriptions?: SubscriptionDisplayItem[];
  initialError?: string | null;
}

export function SubscriptionsPage({
  initialSubscriptions,
  initialError,
}: SubscriptionsPageProps = {}) {
  const router = useRouter();

  const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionDisplayItem[]>(
    initialSubscriptions || []
  );
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionDisplayItem | null>(
      initialSubscriptions && initialSubscriptions.length > 0
        ? initialSubscriptions[0]
        : null
    );

  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPendingAction, setIsPendingAction] = useState(false);

  // Pagination states
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Keep state synced when server sends updated props
  useEffect(() => {
    if (initialSubscriptions !== undefined) {
      setSubscriptionsList(initialSubscriptions);
      if (initialSubscriptions.length > 0) {
        setSelectedSubscription((prev) => {
          if (!prev) return initialSubscriptions[0];
          const found = initialSubscriptions.find((s) => s.id === prev.id);
          return found || initialSubscriptions[0];
        });
      } else {
        setSelectedSubscription(null);
      }
    }
  }, [initialSubscriptions]);

  // Quick Action notification helper
  const notifyAction = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Manual client refresh from Supabase
  const refreshData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await getSubscriptions();
      if (!res.success) {
        setErrorMessage(res.error || "Failed to load subscriptions from database.");
      } else {
        const list = res.data || [];
        setSubscriptionsList(list);
        setSelectedSubscription((prev) => {
          if (!prev) return list[0] || null;
          const match = list.find((s) => s.id === prev.id);
          return match || list[0] || null;
        });
        notifyAction("Subscriptions refreshed from database.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error refreshing subscriptions.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Pause/Resume on currently selected subscription via Supabase
  const handleTogglePause = async () => {
    if (!selectedSubscription) return;
    const isCurrentlyPaused = selectedSubscription.status === "paused";
    const nextStatus: SubscriptionDisplayItem["status"] = isCurrentlyPaused
      ? "active"
      : "paused";

    setIsPendingAction(true);
    try {
      const res = await transitionSubscriptionStatus(
        selectedSubscription.id,
        nextStatus
      );
      if (!res.success) {
        notifyAction(`Failed to transition subscription: ${res.error}`);
      } else {
        const updated: SubscriptionDisplayItem = {
          ...selectedSubscription,
          status: nextStatus,
          timeline_next: isCurrentlyPaused ? "Active" : "Paused",
        };

        setSelectedSubscription(updated);
        setSubscriptionsList((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );

        notifyAction(
          res.message ||
            `Subscription ${updated.code} has been ${
              isCurrentlyPaused ? "resumed" : "paused"
            }.`
        );
        router.refresh();
      }
    } catch (err: unknown) {
      notifyAction(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setIsPendingAction(false);
    }
  };

  // Toggle Auto-Renew Policy via Supabase
  const handleToggleAutoRenew = async () => {
    if (!selectedSubscription) return;
    const nextVal = !selectedSubscription.auto_renew;
    const cancelAtPeriodEnd = !nextVal;

    setIsPendingAction(true);
    try {
      const res = await toggleCancelAtPeriodEnd(
        selectedSubscription.id,
        cancelAtPeriodEnd
      );
      if (!res.success) {
        notifyAction(`Failed to update auto-renew: ${res.error}`);
      } else {
        const updated: SubscriptionDisplayItem = {
          ...selectedSubscription,
          auto_renew: nextVal,
        };
        setSelectedSubscription(updated);
        setSubscriptionsList((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        notifyAction(
          res.message ||
            `Auto-renew policy ${nextVal ? "enabled" : "disabled"} for ${
              updated.code
            }.`
        );
        router.refresh();
      }
    } catch (err: unknown) {
      notifyAction(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setIsPendingAction(false);
    }
  };

  // Cancel / Close Subscription via Supabase
  const handleCloseSubscription = async () => {
    if (!selectedSubscription) return;
    if (
      !confirm(
        `Are you sure you want to cancel / close subscription ${selectedSubscription.code}?`
      )
    ) {
      return;
    }

    setIsPendingAction(true);
    try {
      const res = await transitionSubscriptionStatus(
        selectedSubscription.id,
        "closed"
      );
      if (!res.success) {
        notifyAction(`Failed to close subscription: ${res.error}`);
      } else {
        const updated: SubscriptionDisplayItem = {
          ...selectedSubscription,
          status: "closed",
          timeline_next: "Closed",
          auto_renew: false,
        };
        setSelectedSubscription(updated);
        setSubscriptionsList((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        notifyAction(res.message || `Subscription ${updated.code} closed.`);
        router.refresh();
      }
    } catch (err: unknown) {
      notifyAction(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setIsPendingAction(false);
    }
  };

  // Export filtered subscriptions to CSV
  const handleExportCSV = () => {
    if (filteredSubscriptions.length === 0) {
      notifyAction("No subscriptions available to export.");
      return;
    }
    const headers = [
      "ID",
      "Code",
      "Customer Name",
      "Company",
      "Contact",
      "Plan",
      "Billing Cycle",
      "Status",
      "Amount",
      "Next Billing",
      "Start Date",
    ];
    const rows = filteredSubscriptions.map((s) => [
      s.id,
      s.code,
      `"${s.customer_name.replace(/"/g, '""')}"`,
      `"${s.customer_company.replace(/"/g, '""')}"`,
      `"${s.customer_contact.replace(/"/g, '""')}"`,
      `"${s.plan_name.replace(/"/g, '""')}"`,
      s.billing_cycle,
      s.status,
      s.amount,
      s.timeline_next,
      s.timeline_from,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `subscriptions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifyAction(`Exported ${filteredSubscriptions.length} subscriptions to CSV.`);
  };

  // Dynamic unique plans for filter dropdown
  const availablePlans = useMemo(() => {
    return Array.from(
      new Set(subscriptionsList.map((s) => s.plan_name).filter(Boolean))
    );
  }, [subscriptionsList]);

  // Filtered subscriptions based on tabs, search, and dropdowns
  const filteredSubscriptions = useMemo(() => {
    return subscriptionsList.filter((item) => {
      // Tab filter
      if (activeTab !== "all" && item.status !== activeTab) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesId = item.id.toLowerCase().includes(query);
        const matchesCompany = item.customer_company
          .toLowerCase()
          .includes(query);
        const matchesName = item.customer_name.toLowerCase().includes(query);
        const matchesContact = item.customer_contact
          .toLowerCase()
          .includes(query);
        const matchesPlan = item.plan_name.toLowerCase().includes(query);
        const matchesStatus = item.status.toLowerCase().includes(query);
        if (
          !matchesCode &&
          !matchesId &&
          !matchesCompany &&
          !matchesName &&
          !matchesContact &&
          !matchesPlan &&
          !matchesStatus
        ) {
          return false;
        }
      }

      // Plan filter
      if (planFilter !== "all" && item.plan_name !== planFilter) {
        return false;
      }

      // Cycle filter
      if (
        cycleFilter !== "all" &&
        item.billing_cycle.toLowerCase() !== cycleFilter.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [subscriptionsList, activeTab, searchQuery, planFilter, cycleFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, planFilter, cycleFilter]);

  // Paginated records for table view
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubscriptions.length / pageSize)
  );

  const paginatedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubscriptions.slice(start, start + pageSize);
  }, [filteredSubscriptions, currentPage, pageSize]);

  // Dynamic KPIs computed from live subscriptionsList
  const totalCount = subscriptionsList.length;
  const activeCount = subscriptionsList.filter((s) => s.status === "active").length;
  const activePercent =
    totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : "0.0";
  const pipelineCount = subscriptionsList.filter(
    (s) =>
      s.status === "trial" ||
      s.status === "confirmed" ||
      s.status === "draft" ||
      s.status === "quotation"
  ).length;
  const closedCount = subscriptionsList.filter((s) => s.status === "closed").length;
  const churnPercent =
    totalCount > 0 ? ((closedCount / totalCount) * 100).toFixed(1) : "0.0";

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: subscriptionsList.length,
      active: subscriptionsList.filter((s) => s.status === "active").length,
      confirmed: subscriptionsList.filter((s) => s.status === "confirmed").length,
      quotation: subscriptionsList.filter((s) => s.status === "quotation").length,
      draft: subscriptionsList.filter((s) => s.status === "draft").length,
      paused: subscriptionsList.filter((s) => s.status === "paused").length,
      closed: subscriptionsList.filter((s) => s.status === "closed").length,
      trial: subscriptionsList.filter((s) => s.status === "trial").length,
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
      case "quotation":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-label-sm text-[11px] font-semibold border border-indigo-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Quotation
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
      header: "Subscription ID",
      cell: (item) => {
        const isSelected = selectedSubscription?.id === item.id;
        return (
          <div className="flex items-center gap-1.5">
            <Link
              href={`/subscriptions/${item.id}`}
              onClick={(e) => e.stopPropagation()}
              className={`font-mono-data-sm text-mono-data-sm font-semibold hover:underline ${
                isSelected ? "text-primary" : "text-primary"
              }`}
              title="View Subscription Detail"
            >
              {item.code}
            </Link>
            {item.status === "active" && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
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
      header: "Plan & Tier",
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
      header: "Actions",
      align: "center",
      className: "w-20 px-2 text-center",
      cell: (item) => (
        <div className="flex items-center justify-center gap-1">
          <Link
            href={`/subscriptions/${item.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1 hover:bg-surface-container rounded-md text-on-surface-variant hover:text-primary transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSubscription(item);
              setIsInspectorOpen(true);
            }}
            className="p-1 hover:bg-surface-container rounded-md text-on-surface-variant hover:text-on-surface transition-colors"
            title="Inspect"
          >
            <MoreVertical size={16} />
          </button>
        </div>
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

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-body-sm text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50"
            >
              Retry
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
              Manage live recurring subscriptions, renewals, customer contracts, and lifecycle statuses directly in Supabase.
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
                placeholder="Filter by subscription ID, customer, plan..."
                className="w-64 md:w-72 h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/60 transition-all text-xs"
              />
            </div>

            <button
              type="button"
              onClick={refreshData}
              disabled={isLoading}
              className="h-10 px-3.5 flex items-center gap-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm border border-surface-container-high/60 transition-all text-xs font-medium disabled:opacity-50"
              title="Refresh from database"
            >
              <RefreshCw
                size={16}
                className={`text-on-surface-variant ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-3.5 flex items-center gap-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm border border-surface-container-high/60 transition-all text-xs font-medium"
            >
              <Download size={16} className="text-on-surface-variant" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/subscriptions/new"
              className="h-10 px-4 flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-label-md text-label-md shadow-sm transition-all text-xs font-medium"
            >
              <PlusCircle size={16} />
              <span>Create Subscription</span>
            </Link>
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
                {totalCount}
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant font-medium text-xs">
                contracts
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm mt-1 text-xs">
              <span className="inline-flex items-center text-emerald-600 font-mono-data-sm font-semibold">
                <ArrowUp size={12} />
                Live Supabase Records
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
                {activeCount}
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-emerald-600 font-medium text-xs">
                {activePercent}% share
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm mt-1">
              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, Number(activePercent))
                    )}%`,
                  }}
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
                In Pipeline / Draft
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3 mb-1 flex items-baseline gap-2">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                {pipelineCount}
              </span>
              <span className="inline-flex items-center text-amber-600 font-mono-data-sm font-semibold text-xs">
                <TrendingUp size={12} className="mr-0.5" />
                Pipeline
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-[11px] mt-1">
              <span>Draft, Quotation &amp; Confirmed</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                Cancelled / Closed
              </span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="mt-3 mb-1 flex items-baseline gap-2">
              <span className="font-mono-data-lg text-mono-data-lg text-on-surface font-semibold tracking-tight text-2xl">
                {closedCount}
              </span>
              <span className="font-mono-data-sm text-mono-data-sm text-rose-600 font-medium text-xs">
                {churnPercent}% churn
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
              { id: "confirmed", label: "Confirmed", count: tabCounts.confirmed },
              { id: "quotation", label: "Quotation", count: tabCounts.quotation },
              { id: "draft", label: "Draft", count: tabCounts.draft },
              { id: "paused", label: "Paused", count: tabCounts.paused },
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
            <div className="flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 gap-1 border border-surface-container-high/40">
              <span className="text-on-surface-variant">Plan:</span>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                aria-label="Filter by subscription plan"
                className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">All Plans</option>
                {availablePlans.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
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
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            {(planFilter !== "all" ||
              cycleFilter !== "all" ||
              searchQuery.trim() !== "" ||
              activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                  setPlanFilter("all");
                  setCycleFilter("all");
                }}
                className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm uppercase tracking-wide font-medium border border-surface-container-high/40 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Main Content Split: Data Grid + Detail Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table Container */}
          <div
            className={`${
              isInspectorOpen && selectedSubscription
                ? "lg:col-span-8"
                : "lg:col-span-12"
            } flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/50 overflow-hidden transition-all`}
          >
            <DataTable
              columns={columns}
              data={paginatedSubscriptions}
              keyExtractor={(item) => item.id}
              selectable={false}
              selectedIds={
                selectedSubscription ? [selectedSubscription.id] : []
              }
              onRowClick={(item) => {
                setSelectedSubscription(item);
                setIsInspectorOpen(true);
              }}
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={filteredSubscriptions.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              isLoading={isLoading}
              searchPlaceholder="Filter subscriptions..."
              emptyState={
                subscriptionsList.length === 0 ? (
                  <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-3">
                      <Inbox size={24} />
                    </div>
                    <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-1">
                      No subscriptions found
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-4">
                      There are currently no subscription records in the database. Create a new subscription to get started.
                    </p>
                    <Link
                      href="/subscriptions/new"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-label-md text-xs font-semibold shadow hover:bg-primary/90 transition-colors"
                    >
                      <PlusCircle size={16} />
                      <span>Create Subscription</span>
                    </Link>
                  </div>
                ) : (
                  <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-3">
                      <Search size={24} />
                    </div>
                    <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-1">
                      No matching subscriptions
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-4">
                      No subscriptions matched your active filter or search query.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveTab("all");
                        setPlanFilter("all");
                        setCycleFilter("all");
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-medium transition-colors"
                    >
                      <span>Reset Filters</span>
                    </button>
                  </div>
                )
              }
            />
          </div>

          {/* Right Column: Detail Inspector Drawer */}
          {isInspectorOpen && selectedSubscription && (
            <div className="lg:col-span-4 flex flex-col bg-surface-container-lowest rounded-xl shadow-md border border-surface-container-high/60 overflow-hidden relative transition-all">
              {/* Drawer Top Header */}
              <div className="p-5 bg-surface-container-low/50 flex flex-col gap-3 border-b border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/subscriptions/${selectedSubscription.id}`}
                      className="font-mono-data-md text-mono-data-md font-bold text-primary text-sm hover:underline"
                      title="View full subscription detail"
                    >
                      {selectedSubscription.code}
                    </Link>
                    {renderStatusBadge(selectedSubscription.status)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/subscriptions/${selectedSubscription.id}`}
                      className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                      title="View & Edit Subscription"
                    >
                      <FileEdit size={16} />
                    </Link>
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
                      Next Billing
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
                  {selectedSubscription.recent_invoices.length > 0 ? (
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
                  ) : (
                    <div className="p-3 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-lg border border-surface-container-high/30">
                      No invoices generated yet.
                    </div>
                  )}
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
                          ? "Automatically renews at term end"
                          : "Scheduled to cancel at period end"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isPendingAction}
                    onClick={handleToggleAutoRenew}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors disabled:opacity-50 ${
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
              <div className="p-4 bg-surface-container-low/70 flex flex-col gap-2 border-t border-surface-container-high/40">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={isPendingAction}
                    onClick={handleTogglePause}
                    className="w-1/2 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm border border-surface-container-high/50 transition-all text-center text-xs font-semibold disabled:opacity-50"
                  >
                    {selectedSubscription.status === "paused"
                      ? "Resume Billing"
                      : "Pause Billing"}
                  </button>
                  {selectedSubscription.status !== "closed" ? (
                    <button
                      type="button"
                      disabled={isPendingAction}
                      onClick={handleCloseSubscription}
                      className="w-1/2 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-label-md text-label-md shadow-sm border border-rose-200 transition-all text-center text-xs font-semibold disabled:opacity-50"
                    >
                      Cancel / Close
                    </button>
                  ) : (
                    <span className="w-1/2 py-2 text-center text-xs font-medium text-on-surface-variant">
                      Subscription Closed
                    </span>
                  )}
                </div>

                <Link
                  href={`/subscriptions/${selectedSubscription.id}`}
                  className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-label-md text-label-md shadow-sm transition-all text-center text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Manage Full Lifecycle</span>
                  <ChevronRight size={14} />
                </Link>
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
