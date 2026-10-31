"use server";

import { getDashboardMetrics, type DashboardMetrics } from "@/lib/billing/dashboard-service";
import type { ActionResponse } from "@/types";

/**
 * Server action to fetch the latest dashboard metrics on demand.
 */
export async function fetchDashboardMetricsAction(): Promise<ActionResponse<DashboardMetrics>> {
  try {
    const metrics = await getDashboardMetrics();
    return {
      success: true,
      data: metrics,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load dashboard metrics.";
    return {
      success: false,
      error: message,
    };
  }
}
