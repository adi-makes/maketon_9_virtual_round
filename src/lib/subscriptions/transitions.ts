import type { SubscriptionStatus, BillingFrequency } from "@/types";

/**
 * Valid state transitions for SubscriptIQ subscription lifecycles.
 */
export const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  draft: ["quotation", "confirmed"],
  quotation: ["confirmed", "closed"],
  confirmed: ["active", "closed"],
  active: ["paused", "closed"],
  paused: ["active", "closed"],
  closed: [],
};

/**
 * Calculates next billing date based on start date, billing frequency, and interval count.
 * Supports daily, weekly, monthly, and yearly cycles.
 */
export function calculateNextBillingDate(
  startDate: Date,
  frequency: BillingFrequency,
  intervalCount: number = 1
): Date {
  const next = new Date(startDate.getTime());
  const count = Math.max(1, intervalCount);

  if (frequency === "daily") {
    next.setDate(next.getDate() + count);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + count * 7);
  } else if (frequency === "yearly") {
    next.setFullYear(next.getFullYear() + count);
  } else {
    // Default to monthly
    next.setMonth(next.getMonth() + count);
  }
  return next;
}

/**
 * Validates whether a state transition is permitted.
 */
export function isValidTransition(
  currentStatus: SubscriptionStatus,
  nextStatus: SubscriptionStatus
): boolean {
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}
