"use client";

import React from "react";
import Link from "next/link";
import { Search, Bell, HelpCircle, Plus } from "lucide-react";

export function TopNav() {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-gutter-md flex items-center justify-between gap-space-md border-b border-surface-container-high/30">
      {/* Left: Breadcrumbs & Search */}
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
          <Link href="/dashboard" className="font-medium text-on-surface hover:text-primary transition-colors">
            SubscriptIQ
          </Link>
          <span className="text-on-surface-variant/40">/</span>
          <span className="text-on-surface-variant">Console</span>
        </div>
        <div className="h-4 w-[1px] bg-surface-container-high hidden md:block" />
        <div className="relative hidden lg:flex items-center">
          <Search size={18} className="absolute left-3 text-on-surface-variant pointer-events-none" />
          <input
            className="w-80 h-9 pl-9 pr-14 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Search subscriptions, customers, invoices..."
            type="text"
          />
          <kbd className="absolute right-2 font-mono-data-sm text-mono-data-sm text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded text-xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Currency, Notifications, Support, CTA & Profile */}
      <div className="flex items-center gap-space-sm">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low font-mono-data-sm text-mono-data-sm text-on-surface font-medium text-xs">
          <span className="text-on-surface-variant">Curr:</span>
          <span>INR (₹)</span>
        </div>

        <button
          className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
        </button>

        <button
          className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          type="button"
          aria-label="Help & Documentation"
        >
          <HelpCircle size={20} />
        </button>

        <Link
          href="/subscriptions/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary shadow-sm transition-all text-xs font-semibold"
        >
          <Plus size={16} />
          <span>New Subscription</span>
        </Link>

        <img
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover ml-space-xs ring-1 ring-surface-container-high"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh5ZpRqItpebLTkNaWAeUvvB-NJOKvtmcp6Qa1jtAYLqfcFZDGVjqprbnnnQ_A3Pmz1TKE8lmJVBefoLodIgfW4WJbLf1OuMcp9TL5007KictxwsgI1oz7FxLQdS6KR9dwGApXiXPa1meBPp1DdUslKmiG2hb960kdqoJ50JLtdlAehNIpb8sRr3WEv2GCFwSwqPywa77CdMfbd-qrfuolI6C9VHqlsTS5FYbTzvI"
        />
      </div>
    </header>
  );
}

export default TopNav;

