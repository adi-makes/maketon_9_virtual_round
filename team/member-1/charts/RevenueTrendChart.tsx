"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Wallet, ArrowUpRight, Calendar } from "lucide-react";
import { mockRevenueStats, MonthlyRevenueStat } from "../mockData";

export interface RevenueTrendChartProps {
  data?: MonthlyRevenueStat[];
  metricKey?: "net_revenue" | "mrr" | "new_revenue" | "collected" | "revenue";
  height?: number;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatINR = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as MonthlyRevenueStat & { monthLabel: string };
    const netRevenue = payload.find((p) => p.dataKey === "net_revenue")?.value ?? data.net_revenue;
    const mrr = payload.find((p) => p.dataKey === "mrr")?.value ?? data.mrr;
    const newRev = data.new_revenue;

    return (
      <div className="bg-inverse-surface text-inverse-on-surface p-3 rounded-xl shadow-xl border border-white/10 min-w-[210px] text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/15">
          <div className="flex items-center gap-1.5 font-medium text-white/90">
            <Calendar size={14} className="text-secondary-fixed-dim" />
            <span>Cohort {data.monthLabel || label}</span>
          </div>
          <span className="font-mono-data-sm text-[11px] text-secondary-fixed-dim bg-white/10 px-1.5 py-0.5 rounded">
            Audited
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-surface-container-highest">
              <span className="w-2 h-2 rounded-full bg-[#4f46e5]" />
              <TrendingUp size={13} className="text-primary-fixed-dim" />
              MRR:
            </span>
            <span className="font-mono-data-sm font-bold text-white">{formatINR(mrr)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-surface-container-highest">
              <span className="w-2 h-2 rounded-full bg-[#006693]" />
              <Wallet size={13} className="text-tertiary-fixed-dim" />
              Net Settled:
            </span>
            <span className="font-mono-data-sm font-semibold text-white">{formatINR(netRevenue)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-surface-container-highest">
              <ArrowUpRight size={13} className="text-emerald-400" />
              New Expansion:
            </span>
            <span className="font-mono-data-sm text-emerald-400">+{formatINR(newRev)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueTrendChart({
  data = mockRevenueStats,
  metricKey = "net_revenue",
  height = 280,
}: RevenueTrendChartProps) {
  // Transform data to include formatted month labels
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
        <AreaChart data={chartData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
              <stop offset="90%" stopColor="#4f46e5" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="netRevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#006693" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#006693" stopOpacity={0.0} />
            </linearGradient>
          </defs>

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
            tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`)}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="mrr"
            name="MRR"
            stroke="#3525cd"
            strokeWidth={2.5}
            fill="url(#mrrGradient)"
            dot={{ r: 3.5, fill: "#ffffff", stroke: "#3525cd", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
          />

          <Area
            type="monotone"
            dataKey="net_revenue"
            name="Net Revenue"
            stroke="#006693"
            strokeWidth={2}
            fill="url(#netRevGradient)"
            dot={{ r: 3, fill: "#ffffff", stroke: "#006693", strokeWidth: 1.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueTrendChart;
