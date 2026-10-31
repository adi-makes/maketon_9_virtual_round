"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Users, UserPlus, Calendar } from "lucide-react";
import { mockRevenueStats, type MonthlyRevenueStat } from "@/lib/mock-data";

export interface SubscriptionGrowthChartProps {
  data?: MonthlyRevenueStat[];
  height?: number;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomBarTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as MonthlyRevenueStat & { monthLabel: string };
    const activeSubs = payload.find((p) => p.dataKey === "active_subscriptions")?.value ?? data.active_subscriptions;
    const newCust = payload.find((p) => p.dataKey === "new_customers")?.value ?? data.new_customers;

    return (
      <div className="bg-inverse-surface text-inverse-on-surface p-3 rounded-xl shadow-xl border border-white/10 min-w-[200px] text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/15">
          <div className="flex items-center gap-1.5 font-medium text-white/90">
            <Calendar size={14} className="text-secondary-fixed-dim" />
            <span>Cohort {data.monthLabel || label}</span>
          </div>
          <span className="font-mono-data-sm text-[11px] text-secondary-fixed-dim bg-white/10 px-1.5 py-0.5 rounded">
            Lifecycle
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-surface-container-highest">
              <span className="w-2 h-2 rounded-full bg-[#4f46e5]" />
              <Users size={13} className="text-primary-fixed-dim" />
              Active Subs:
            </span>
            <span className="font-mono-data-sm font-bold text-white">{activeSubs}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-surface-container-highest">
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
              <UserPlus size={13} className="text-sky-300" />
              New Additions:
            </span>
            <span className="font-mono-data-sm font-semibold text-emerald-400">+{newCust}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function SubscriptionGrowthChart({
  data = mockRevenueStats,
  height = 240,
}: SubscriptionGrowthChartProps) {
  const chartData = data.map((item) => {
    const [, monthNum] = item.month.split("-");
    const monthIndex = parseInt(monthNum, 10) - 1;
    return {
      ...item,
      monthLabel: monthNames[monthIndex] || item.month,
    };
  });

  return (
    <div className="w-full relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eaedff" vertical={false} />

          <XAxis
            dataKey="monthLabel"
            stroke="#777587"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#dae2fd" }}
            tick={{ fill: "#777587", fontFamily: "JetBrains Mono" }}
          />

          <YAxis
            stroke="#777587"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#777587", fontFamily: "JetBrains Mono" }}
            allowDecimals={false}
          />

          <Tooltip content={<CustomBarTooltip />} />

          <Bar
            dataKey="active_subscriptions"
            name="Active Subscriptions"
            fill="#4f46e5"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />

          <Bar
            dataKey="new_customers"
            name="New Customers"
            fill="#0ea5e9"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SubscriptionGrowthChart;

