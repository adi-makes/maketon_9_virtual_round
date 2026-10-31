"use client";

import React, { useState } from "react";
import {
  Building2,
  Building,
  CheckCircle2,
  Copy,
  Check,
  Mail,
  Phone,
  Receipt,
  Network,
  Link2,
  SlidersHorizontal,
  Wallet,
  ArrowUpDown,
  Landmark,
  ShieldCheck,
  UserPlus,
  MoreVertical,
  ShieldAlert,
  Save,
  History,
  RotateCcw,
  Sparkles,
  Key,
  Bell,
  FileText,
  Users,
  X,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  title: string;
  role: "SUPER ADMIN" | "FINANCE LEAD" | "TECH LEAD" | "MEMBER";
  scope: string;
  status: "active" | "away";
  avatar: string;
}

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "mem-001",
    name: "Arjun Sharma",
    email: "arjun@subscriptiq.in",
    title: "Chief Administrator",
    role: "SUPER ADMIN",
    scope: "All Scopes",
    status: "active",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCWRAlPPcFitIaqivXckiy0_d4BdGMr0SBU38pYYo27KJpc3FL_KGMBGrCN8Bg-tyw2TtpCxZTkBlzeGXHsrjJRSIfQ-1vXUa2I94bnSlDVXlDt1spHqly7NRN1wsfuukZIZvZFtlzK8s-2HZvDZ2W8UdFjKzhhgyHiLW1YwbCskiinBGXFa7IQzCtsJ1kSA4fTepnDKwxY4plCFU5Km8lgZzAnpY_Mwm1CQtrmQXM",
  },
  {
    id: "mem-002",
    name: "Priya Nair",
    email: "priya.nair@subscriptiq.in",
    title: "Finance & Billing Ops",
    role: "FINANCE LEAD",
    scope: "GST/Payout Sign-off",
    status: "active",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC573VimiN4MWMExu2RaYAQDlXrxTHma8dCrNaE_5tSglDhwbOKg_W0iFFWZ0KSx-rJ6r8kUJeAD0Ntvn_KW18GNJ23kvHuJP922sNstODI2ogTi1Ftfh8ZwYkiW7Q-q6xNYlbob7LPBX8EmJUbc75wyUb6ZAUHOKEBOUSMtZT6a_vgLq9G7jlzKgPZErSyUZ3rT-ETjW_GITABVsFGu0TAzur3YI5tkVtjOjQAK3w",
  },
  {
    id: "mem-003",
    name: "Rajesh K",
    email: "rajesh.k@subscriptiq.in",
    title: "Systems & Webhooks",
    role: "TECH LEAD",
    scope: "API & Dev",
    status: "away",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBykaD52h3ca_3hzM-Rsl8o-HOfIEUor_fut5uj2yP6L9RmLBrYw6C6kJnRH5Arf0IRkX_hZWHO9dhhPbuQWXMqiKrrhIsc9GOl-kUbbKyIW5kjP8u_EOXLiPjYqYTl8ydYJMvBas9RCbZ5PSYHGgSJZtMyPY5Inhqjxy7Jp7-b4RT2cKrclkzXeN9gU_hg4qct-13NQVuwv_-F4cbI3hyazIXMUQlJcYcB9UjjxPk",
  },
];

export function SettingsPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    | "business"
    | "general"
    | "tax"
    | "billing"
    | "users"
    | "webhooks"
    | "notifications"
  >("business");

  // Form states: Legal Entity
  const [companyName, setCompanyName] = useState(
    "SubscriptIQ Technologies Pvt Ltd"
  );
  const [cin, setCin] = useState("U72900KA2022PTC159021");
  const [entityType, setEntityType] = useState("Private Limited Company");
  const [address, setAddress] = useState(
    "Outer Ring Road, Kadubeesanahalli, Bengaluru, Karnataka 560103"
  );
  const [email, setEmail] = useState("compliance@subscriptiq.in");
  const [phone, setPhone] = useState("+91 80 4968 2200");

  // Form states: Tax & Compliance
  const [gstin, setGstin] = useState("29AABCU9603R1ZM");
  const [pan, setPan] = useState("AABCU9603R");
  const [ewayThreshold, setEwayThreshold] = useState("50000");

  // Form states: Gateways & Settlement
  const [upiAutoPay, setUpiAutoPay] = useState(true);
  const [payoutBank, setPayoutBank] = useState("HDFC Bank •••• 9192");
  const [payoutWindow, setPayoutWindow] = useState("T + 1 Settlement");

  // Team state & invite modal
  const [teamMembers, setTeamMembers] =
    useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] =
    useState<TeamMember["role"]>("FINANCE LEAD");

  // UI Feedback States
  const [copiedGstin, setCopiedGstin] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTestingRouting, setIsTestingRouting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyGstin = () => {
    navigator.clipboard.writeText(gstin);
    setCopiedGstin(true);
    showToast("GSTIN copied to clipboard!");
    setTimeout(() => setCopiedGstin(false), 2000);
  };

  const handleTestRouting = () => {
    setIsTestingRouting(true);
    setTimeout(() => {
      setIsTestingRouting(false);
      showToast(
        "Gateway routing verified: Razorpay Primary, ICICI/HDFC fallback (Latency: 98ms)."
      );
    }, 1200);
  };

  const handleSaveChanges = () => {
    setHasUnsavedChanges(false);
    showToast("All configuration and compliance parameters saved successfully.");
  };

  const handleDiscardChanges = () => {
    setCompanyName("SubscriptIQ Technologies Pvt Ltd");
    setCin("U72900KA2022PTC159021");
    setEntityType("Private Limited Company");
    setAddress(
      "Outer Ring Road, Kadubeesanahalli, Bengaluru, Karnataka 560103"
    );
    setEmail("compliance@subscriptiq.in");
    setPhone("+91 80 4968 2200");
    setGstin("29AABCU9603R1ZM");
    setPan("AABCU9603R");
    setEwayThreshold("50000");
    setUpiAutoPay(true);
    setHasUnsavedChanges(false);
    showToast("Changes reverted to previously active configuration.");
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName,
      email: newMemberEmail,
      title:
        newMemberRole === "FINANCE LEAD"
          ? "Finance Specialist"
          : newMemberRole === "TECH LEAD"
          ? "API Integrations"
          : "Operations Analyst",
      role: newMemberRole,
      scope:
        newMemberRole === "FINANCE LEAD"
          ? "GST & Invoicing"
          : newMemberRole === "TECH LEAD"
          ? "Webhooks & Keys"
          : "Read Only",
      status: "active",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    };

    setTeamMembers((prev) => [...prev, newMember]);
    setNewMemberName("");
    setNewMemberEmail("");
    setShowInviteModal(false);
    showToast(`Invite invitation sent to ${newMember.email}`);
  };

  return (
    <main className="w-full pt-4 flex-1 px-4 sm:px-6 py-6 bg-surface">
      <div className="flex flex-col w-full max-w-7xl mx-auto">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 p-3 bg-surface-container-lowest border border-primary/20 rounded-xl text-primary font-body-sm text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
            <span className="text-on-surface font-medium">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-on-surface-variant hover:text-on-surface"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Header Bar with Metadata & Overview */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold text-xs">
                SubscriptIQ
              </span>
              <span className="text-on-surface-variant/40">/</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-xs">
                Settings
              </span>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary/10 font-label-sm text-[11px] text-primary font-semibold tracking-wide">
                SYSTEM PREFERENCES &amp; COMPLIANCE
              </span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold text-2xl sm:text-3xl">
                Settings
              </h1>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant text-xs font-medium">
                TENANT_ID: SIQ-IN-BLR-0984
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm max-w-3xl">
              Manage organization profile, GST tax automation, payment gateway credentials, user roles, and webhooks.
            </p>
          </div>

          {/* Quick Status Pill & Audit Stamp */}
          <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-xl shadow-sm border border-surface-container-high/50 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-medium">
                NIC Sandbox: Syncing Live
              </span>
            </div>
            <button
              onClick={() => showToast("Audit log session: 42 events recorded today.")}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Audit Log"
              type="button"
            >
              <History size={16} />
            </button>
            <button
              onClick={() =>
                showToast("Configuration Health Score: 100% compliant.")
              }
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Configuration Health"
              type="button"
            >
              <ShieldCheck size={16} />
            </button>
          </div>
        </div>

        {/* Tabbed Navigation Bar */}
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm mb-6 p-1.5 border border-surface-container-high/50">
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: "business", label: "Business & Entity Profile", hasDot: true },
              { id: "tax", label: "Tax & GST Configuration" },
              { id: "billing", label: "Billing & Invoicing Rules" },
              { id: "users", label: "User Management & Roles" },
              { id: "webhooks", label: "Webhooks & API Keys" },
              { id: "notifications", label: "Notification Preferences" },
              { id: "general", label: "General Settings" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3.5 py-2 rounded-lg font-label-md text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium"
                  }`}
                  type="button"
                >
                  <span>{tab.label}</span>
                  {tab.hasDot && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content 1: Webhooks & API Keys Dedicated View */}
        {activeTab === "webhooks" && (
          <div className="flex flex-col gap-6 mb-24">
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 border border-surface-container-high/50 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Key size={20} />
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold text-base">
                      API Credentials &amp; Webhook Endpoints
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                      REST API endpoints for real-time mandate synchronization and invoice push.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => showToast("New secret token generated.")}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-label-md text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Generate Key
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                    Production API Secret
                  </label>
                  <div className="relative">
                    <input
                      readOnly
                      className="w-full h-10 px-3 pr-10 rounded-lg bg-surface-container-low font-mono-data-sm text-xs text-on-surface border border-surface-container-high/50"
                      value="siq_live_9984_e7f293b4a203f"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("siq_live_9984_e7f293b4a203f");
                        showToast("API Secret copied!");
                      }}
                      className="absolute right-3 top-2.5 text-on-surface-variant hover:text-primary"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                    Webhook Listener URL
                  </label>
                  <div className="relative">
                    <input
                      readOnly
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-mono-data-sm text-xs text-on-surface border border-surface-container-high/50"
                      value="https://api.subscriptiq.in/v2/webhooks/razorpay"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Tab Content 2: Notifications Dedicated View */}
        {activeTab === "notifications" && (
          <div className="flex flex-col gap-6 mb-24">
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 border border-surface-container-high/50 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold text-base">
                    Automated Notifications &amp; Dunning Alerts
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                    Pre-debit notifications required by RBI guidelines and invoice delivery channels.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    title: "Pre-Debit SMS / Email Notice",
                    desc: "Dispatched 48 hours prior to recurring mandate execution as per RBI directive.",
                    defaultChecked: true,
                  },
                  {
                    title: "IRN Generation Failure Alert",
                    desc: "Urgent Slack & email alert if NIC invoice clearance encounters timeout.",
                    defaultChecked: true,
                  },
                  {
                    title: "Failed Payment Dunning Sequence",
                    desc: "Automated retry reminders sent at days 1, 3, and 7 following payment bounce.",
                    defaultChecked: true,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/40"
                  >
                    <div className="flex flex-col">
                      <span className="font-label-md text-xs font-semibold text-on-surface">
                        {item.title}
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        {item.desc}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        defaultChecked={item.defaultChecked}
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-surface-container-high rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Primary 2-Column Responsive Bento Grid (Visible on Business, Tax, Billing, Users, General or when activeTab matches) */}
        {(activeTab === "business" ||
          activeTab === "tax" ||
          activeTab === "billing" ||
          activeTab === "users" ||
          activeTab === "general") && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-24">
            {/* LEFT COLUMN: Legal Entity & Indian Tax Setup (Span 6) */}
            <div className="xl:col-span-6 flex flex-col gap-6">
              {/* Card 1: Legal Entity Profile */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 flex flex-col gap-4 border border-surface-container-high/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold text-base">
                        Legal Entity Profile
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Master incorporation parameters applied to signed billing contracts.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-data-sm text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface font-semibold">
                    STATUS: REG_VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Company Legal Name */}
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                      Registered Legal Entity Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full h-10 px-3 pr-10 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm text-xs border border-surface-container-high/40 transition-all"
                      />
                      <CheckCircle2
                        size={18}
                        className="absolute right-3 top-2.5 text-emerald-600"
                      />
                    </div>
                  </div>

                  {/* CIN */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                      Corporate Identity No. (CIN)
                    </label>
                    <input
                      type="text"
                      value={cin}
                      onChange={(e) => {
                        setCin(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-mono-data-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm border border-surface-container-high/40 transition-all"
                    />
                  </div>

                  {/* Entity Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                      Entity Classification
                    </label>
                    <div className="h-10 px-3 rounded-lg bg-surface-container-low flex items-center justify-between text-on-surface font-body-md text-xs border border-surface-container-high/40">
                      <select
                        value={entityType}
                        onChange={(e) => {
                          setEntityType(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="bg-transparent w-full focus:outline-none cursor-pointer"
                      >
                        <option value="Private Limited Company">
                          Private Limited Company
                        </option>
                        <option value="Public Limited Company">
                          Public Limited Company
                        </option>
                        <option value="Limited Liability Partnership (LLP)">
                          Limited Liability Partnership (LLP)
                        </option>
                        <option value="Sole Proprietorship">
                          Sole Proprietorship
                        </option>
                      </select>
                      <Building size={16} className="text-on-surface-variant ml-1" />
                    </div>
                  </div>

                  {/* Registered Address */}
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                      Registered Physical Address
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full p-3 rounded-lg bg-surface-container-low font-body-md text-xs text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm resize-none border border-surface-container-high/40 transition-all"
                    />
                  </div>

                  {/* Contact Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                      Corporate Notice Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-3 text-on-surface-variant"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low font-mono-data-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm border border-surface-container-high/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Billing Support Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                      Billing Desk Hotline
                    </label>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3 top-3 text-on-surface-variant"
                      />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low font-mono-data-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm border border-surface-container-high/40 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Entity Verification Bar */}
                <div className="mt-2 p-3 bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/40">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="font-body-sm text-[11px] text-on-surface">
                      MCA Registry Sync validated via Ministry of Corporate Affairs API v1.9
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      showToast("MCA digital registry token successfully re-authenticated.")
                    }
                    className="font-label-sm text-xs text-primary font-semibold hover:underline"
                    type="button"
                  >
                    Re-authenticate
                  </button>
                </div>
              </section>

              {/* Card 2: India Tax Compliance & GST Setup */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 flex flex-col gap-4 border border-surface-container-high/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold text-base">
                        India Tax Compliance &amp; GST Setup
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Central GST orchestration, NIC E-Invoicing pipeline &amp; IRN generation.
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-label-sm text-xs font-semibold border border-emerald-200">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    AUTOTAX ON
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* GSTIN */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                        GSTIN Number
                      </label>
                      <span className="font-label-sm text-emerald-700 font-semibold text-[11px]">
                        State 29 - Karnataka
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => {
                          setGstin(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full h-10 px-3 pr-9 rounded-lg bg-surface-container-low font-mono-data-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm font-semibold tracking-wide border border-surface-container-high/40 transition-all"
                      />
                      <button
                        onClick={handleCopyGstin}
                        className="absolute right-2 top-2.5 text-on-surface-variant hover:text-primary transition-colors"
                        type="button"
                        title="Copy GSTIN"
                      >
                        {copiedGstin ? (
                          <Check size={16} className="text-emerald-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PAN */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                        Corporate PAN
                      </label>
                      <span className="font-label-sm text-on-surface-variant text-[11px]">
                        Validated (CBDT)
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={pan}
                        onChange={(e) => {
                          setPan(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full h-10 px-3 pr-9 rounded-lg bg-surface-container-low font-mono-data-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm tracking-wide border border-surface-container-high/40 transition-all"
                      />
                      <CheckCircle2
                        size={16}
                        className="absolute right-3 top-3 text-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Tax Splitting Rule Breakdown Panel */}
                  <div className="md:col-span-2 p-4 bg-surface-container-low rounded-xl flex flex-col gap-2.5 border border-surface-container-high/40">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-on-surface font-semibold uppercase tracking-wider text-[11px]">
                        GST Regime Breakdown Engine
                      </span>
                      <span className="font-mono-data-sm text-on-surface-variant text-xs">
                        Rule: HSN/SAC 998313
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-surface-container-lowest rounded-lg shadow-sm flex flex-col gap-1 border border-surface-container-high/40">
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-on-surface-variant text-xs">
                            Intra-State (Karnataka)
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 font-mono-data-sm font-semibold text-primary text-[10px]">
                            CGST + SGST
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-mono-data-lg text-on-surface font-bold text-base">
                            9% + 9%
                          </span>
                          <span className="font-body-sm text-on-surface-variant text-[11px]">
                            (Effective 18%)
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-surface-container-lowest rounded-lg shadow-sm flex flex-col gap-1 border border-surface-container-high/40">
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-on-surface-variant text-xs">
                            Inter-State (All India)
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 font-mono-data-sm font-semibold text-emerald-700 text-[10px]">
                            IGST Direct
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-mono-data-lg text-on-surface font-bold text-base">
                            18.00%
                          </span>
                          <span className="font-body-sm text-on-surface-variant text-[11px]">
                            (Standard SaaS rate)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* E-Invoicing Status Row */}
                  <div className="md:col-span-2 p-3 bg-surface-container-lowest rounded-lg shadow-sm flex items-center justify-between border border-surface-container-high/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <Network size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-xs font-semibold text-on-surface">
                          NIC Portal E-Invoicing Gateway
                        </span>
                        <span className="font-mono-data-sm text-[11px] text-on-surface-variant">
                          GSP Session: Active (Key Rotates in 19d)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-label-sm text-xs font-semibold border border-emerald-200">
                        <Link2 size={13} /> Connected &amp; Authenticated
                      </span>
                    </div>
                  </div>

                  {/* E-Way Bill Auto Generation Threshold */}
                  <div className="md:col-span-2 flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-surface-container-high/40">
                    <div className="flex flex-col">
                      <span className="font-label-md text-xs font-semibold text-on-surface">
                        E-Way Bill Auto-Generation Threshold
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        Invoices above this threshold will automatically fetch E-Way dispatch tokens.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-data-md font-bold text-xs text-on-surface">
                        ₹ {Number(ewayThreshold).toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => {
                          const nextVal = prompt(
                            "Enter new E-Way Bill Threshold amount in INR:",
                            ewayThreshold
                          );
                          if (nextVal && !isNaN(Number(nextVal))) {
                            setEwayThreshold(nextVal);
                            setHasUnsavedChanges(true);
                            showToast(`Threshold updated to ₹${nextVal}`);
                          }
                        }}
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
                        type="button"
                        title="Configure Threshold"
                      >
                        <SlidersHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Inline Telemetry: Invoicing & Compliance Sync Health */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col gap-3 border border-surface-container-high/50">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-xs">
                    B2B Compliance Telemetry (Last 30 Days)
                  </span>
                  <span className="font-mono-data-sm text-emerald-700 font-semibold text-xs">
                    99.98% IRN Success
                  </span>
                </div>
                {/* SVG Micro Visualization: Daily IRN Generation Volume Sparkline */}
                <div className="w-full h-12 flex items-end">
                  <svg
                    className="w-full h-10 text-primary"
                    preserveAspectRatio="none"
                    viewBox="0 0 500 50"
                  >
                    <path
                      d="M0,42 L20,38 L40,40 L60,30 L80,32 L100,20 L120,25 L140,15 L160,18 L180,10 L200,12 L220,18 L240,8 L260,14 L280,6 L300,9 L320,15 L340,8 L360,5 L380,12 L400,6 L420,10 L440,4 L460,7 L480,2 L500,5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
                <div className="flex justify-between items-center pt-2 font-mono-data-sm text-[11px] text-on-surface-variant border-t border-surface-container-high/40">
                  <span>Total Signed Invoices: 4,129</span>
                  <span>Zero Failed Submissions</span>
                  <span>Avg IRN Latency: 142ms</span>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: Payment Gateway Orchestration & Team Governance (Span 6) */}
            <div className="xl:col-span-6 flex flex-col gap-6">
              {/* Card 3: Payment Gateway & Settlement Orchestration */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 flex flex-col gap-4 border border-surface-container-high/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold text-base">
                        Payment Gateways &amp; Settlement Orchestration
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Manage subscription auto-debit routing, UPI AutoPay, and e-NACH mandating.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleTestRouting}
                    disabled={isTestingRouting}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-medium transition-colors flex items-center gap-1 border border-surface-container-high/40"
                    type="button"
                  >
                    <ArrowUpDown
                      size={14}
                      className={isTestingRouting ? "animate-spin text-primary" : ""}
                    />
                    <span>{isTestingRouting ? "Testing..." : "Test Routing"}</span>
                  </button>
                </div>

                {/* Primary Gateway Block */}
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3 border border-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm font-semibold border border-surface-container-high/50">
                        <span className="font-mono-data-md text-xs font-bold">RZP</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-xs font-semibold text-on-surface">
                            Razorpay B2B Subscriptions
                          </span>
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-label-sm text-[10px] font-bold">
                            PRIMARY
                          </span>
                        </div>
                        <span className="font-mono-data-sm text-[11px] text-on-surface-variant">
                          Merchant ID: rzp_live_K89Fw00x9Q
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-xs font-semibold flex items-center gap-1 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Production Mode
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-body-sm text-xs border-t border-surface-container-high/30">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Check size={14} className="text-emerald-600" />
                      <span>Webhook: Active (200 OK)</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Check size={14} className="text-emerald-600" />
                      <span>Sub-metering Webhooks</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Mandate Rails */}
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3 border border-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-emerald-700 shadow-sm border border-surface-container-high/50">
                        <Landmark size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-xs font-semibold text-on-surface">
                          ICICI / HDFC Corporate e-NACH Stack
                        </span>
                        <span className="font-mono-data-sm text-[11px] text-on-surface-variant">
                          NPCI Corporate Mandates (Utility Code: NACH0000000004921)
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-[11px] font-semibold">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-container-high/30">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                        UPI AutoPay VPA Routing
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-container-highest font-mono-data-sm text-[10px] text-on-surface font-medium">
                        NPCI Switch Direct
                      </span>
                    </div>
                    {/* Toggle UI representation */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={upiAutoPay}
                        onChange={(e) => {
                          setUpiAutoPay(e.target.checked);
                          setHasUnsavedChanges(true);
                          showToast(
                            `UPI AutoPay routing ${
                              e.target.checked ? "enabled" : "disabled"
                            }.`
                          );
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                {/* Currency & Settlement Rules */}
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2.5 border border-surface-container-high/40">
                  <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                    Settlement Account &amp; Cycle Configuration
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-surface-container-lowest rounded-lg shadow-sm flex flex-col border border-surface-container-high/40">
                      <span className="font-label-sm text-on-surface-variant text-[11px]">
                        Payout Destination Bank
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Landmark size={16} className="text-primary" />
                        <span className="font-mono-data-md font-bold text-xs text-on-surface">
                          {payoutBank}
                        </span>
                      </div>
                      <span className="font-body-sm text-on-surface-variant text-[10px] mt-0.5">
                        IFSC: HDFC0001211 (Koramangala)
                      </span>
                    </div>

                    <div className="p-3 bg-surface-container-lowest rounded-lg shadow-sm flex flex-col border border-surface-container-high/40">
                      <span className="font-label-sm text-on-surface-variant text-[11px]">
                        Default Payout Window
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono-data-md font-bold text-xs text-on-surface">
                          {payoutWindow}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-label-sm text-[10px] font-semibold">
                          Automatic
                        </span>
                      </div>
                      <span className="font-body-sm text-on-surface-variant text-[10px] mt-0.5">
                        Primary Ledger Currency: INR (₹)
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 4: Team Members & Access Control */}
              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 flex flex-col gap-4 border border-surface-container-high/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <Users size={20} />
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold text-base">
                        Team Members &amp; Access Control
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Manage role privileges, tax officer sign-offs, and billing approvals.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold transition-colors border border-surface-container-high/40"
                    type="button"
                  >
                    <UserPlus size={15} />
                    <span>+ Invite Member</span>
                  </button>
                </div>

                {/* Members Table / List */}
                <div className="flex flex-col gap-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-container-high/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <img
                            className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-surface-container-high"
                            src={member.avatar}
                            alt={member.name}
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-surface-container-lowest ${
                              member.status === "active"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          ></span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-label-md text-xs font-semibold text-on-surface truncate">
                              {member.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-label-sm text-[10px] font-bold ${
                                member.role === "SUPER ADMIN"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-surface-container text-on-surface-variant"
                              }`}
                            >
                              {member.role}
                            </span>
                          </div>
                          <span className="font-body-sm text-on-surface-variant truncate text-[11px]">
                            {member.email} • {member.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-data-sm text-on-surface-variant text-[11px] hidden sm:inline">
                          {member.scope}
                        </span>
                        <button
                          onClick={() =>
                            showToast(`Actions open for ${member.name}`)
                          }
                          className="p-1 rounded text-on-surface-variant hover:text-on-surface"
                          type="button"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Role Permissions Architecture Summary */}
                <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between text-xs border border-surface-container-high/40">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <ShieldAlert size={16} className="text-primary" />
                    <span>
                      Role-Based Access Control (RBAC): 3 predefined policy tiers active.
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      showToast(
                        "Security Policy: RBAC enforced with multi-factor auth."
                      )
                    }
                    className="font-label-sm text-xs text-primary font-semibold hover:underline"
                    type="button"
                  >
                    Edit Security Policy
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Floating Sticky Action / Save Bar */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-surface-container-lowest/95 backdrop-blur-md px-6 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-30 flex items-center justify-between border-t border-surface-container-high/50">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-body-sm text-xs text-on-surface">
                You have unsaved changes in{" "}
                <strong className="font-semibold">India Tax Compliance</strong> and{" "}
                <strong className="font-semibold">Razorpay Credentials</strong>.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 rounded-lg font-label-md text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium"
                type="button"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-label-md text-xs font-semibold shadow-sm transition-all"
                type="button"
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high p-6 w-full max-w-md flex flex-col gap-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="font-headline-sm font-semibold text-on-surface text-base">
                    Invite Team Member
                  </h3>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 text-on-surface-variant hover:text-on-surface"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Vikramaditya Sen"
                    className="h-10 px-3 rounded-lg bg-surface-container-low text-xs border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Work Email
                  </label>
                  <input
                    required
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="sen@subscriptiq.in"
                    className="h-10 px-3 rounded-lg bg-surface-container-low text-xs border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Access Tier &amp; Role
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) =>
                      setNewMemberRole(e.target.value as TeamMember["role"])
                    }
                    className="h-10 px-3 rounded-lg bg-surface-container-low text-xs border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="SUPER ADMIN">Super Admin (All scopes)</option>
                    <option value="FINANCE LEAD">
                      Finance Lead (GST &amp; Payout sign-off)
                    </option>
                    <option value="TECH LEAD">
                      Tech Lead (API &amp; Webhooks)
                    </option>
                    <option value="MEMBER">Member (Read-only)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
