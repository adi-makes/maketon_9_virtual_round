import type { SubscriptionStatus } from "@/types";

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
 */
export function calculateNextBillingDate(
  startDate: Date,
  frequency: "monthly" | "yearly",
  intervalCount: number = 1
): Date {
  const next = new Date(startDate.getTime());
  if (frequency === "yearly") {
    next.setFullYear(next.getFullYear() + Math.max(1, intervalCount));
  } else {
    next.setMonth(next.getMonth() + Math.max(1, intervalCount));
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
