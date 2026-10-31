"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  RefreshCw,
  FileText,
  CreditCard,
  Settings,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  dataPath: string;
}

const overviewNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, dataPath: "dashboard" },
];

const managementNav: NavItem[] = [
  { name: "Customers", href: "/customers", icon: Users, dataPath: "customers" },
  { name: "Products", href: "/products", icon: Package, dataPath: "products" },
  { name: "Plans", href: "/plans", icon: Layers, dataPath: "plans" },
  { name: "Subscriptions", href: "/subscriptions", icon: RefreshCw, dataPath: "subscriptions" },
];

const financeNav: NavItem[] = [
  { name: "Invoices", href: "/invoices", icon: FileText, dataPath: "invoices" },
  { name: "Payments", href: "/payments", icon: CreditCard, dataPath: "payments" },
];

const systemNav: NavItem[] = [
  { name: "Settings", href: "/settings", icon: Settings, dataPath: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard" || !pathname;
    }
    return pathname?.startsWith(href);
  };

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-space-xs">
      <div className="px-space-sm font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
        {title}
      </div>
      <nav
        className="space-y-1"
        data-active-classes="bg-primary-container text-on-primary font-label-md rounded-lg"
      >
        {items.map((item) => {
          const active = isLinkActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.dataPath}
              href={item.href}
              data-path={item.dataPath}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex items-center gap-space-sm px-space-sm py-2 transition-all duration-150 bg-primary-container text-on-primary font-label-md rounded-lg shadow-sm"
                  : "flex items-center gap-space-sm px-space-sm py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-150"
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest flex flex-col z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container-high/40">
      {/* Brand Header */}
      <div className="h-16 px-space-md flex items-center justify-between bg-surface-container-lowest border-b border-surface-container-high/30">
        <div className="flex items-center gap-space-sm">
          <img
            alt="SubscriptIQ Brand Logo"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1UfFrVvn2lvwtOmeIvyx4Nv4PTdQGKS4p2-Zs-QasAOsjQh4bv3ynJ4cHLhtxuag8ryproKs8sZIbmxv08PwfYl3suQRnq3NL4KrsWs55gG3wsKrGBtxNWJLwNqJn6IV9Br1N7m5ftKJ4jp15fVwSDVoug1C-wAjeN9hQGIH8KiunQIHb9K9yvkBR_4Io1H2S75H5YakginqGgwk5MwWrlsPhq38MSIv4cEedemk2kk"
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface leading-none font-semibold">
              SubscriptIQ
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[10px]">
              Billing Engine
            </span>
          </div>
        </div>
        <span className="font-mono-data-sm text-mono-data-sm px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium text-xs">
          v2.4
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-space-sm py-space-md space-y-space-md">
        {renderNavGroup("Overview", overviewNav)}
        {renderNavGroup("Management", managementNav)}
        {renderNavGroup("Finance", financeNav)}
        {renderNavGroup("System", systemNav)}
      </div>

      {/* User Footer Profile */}
      <div className="p-space-sm bg-surface-container-lowest border-t border-surface-container-high/30">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="relative flex-shrink-0">
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh5ZpRqItpebLTkNaWAeUvvB-NJOKvtmcp6Qa1jtAYLqfcFZDGVjqprbnnnQ_A3Pmz1TKE8lmJVBefoLodIgfW4WJbLf1OuMcp9TL5007KictxwsgI1oz7FxLQdS6KR9dwGApXiXPa1meBPp1DdUslKmiG2hb960kdqoJ50JLtdlAehNIpb8sRr3WEv2GCFwSwqPywa77CdMfbd-qrfuolI6C9VHqlsTS5FYbTzvI"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface-container-lowest" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface truncate font-medium">
                Arjun Sharma
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
                Chief Administrator
              </span>
            </div>
          </div>
          <ChevronsUpDown size={18} className="text-on-surface-variant flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

