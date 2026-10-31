"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SubscriptionStatus, ActionResponse } from "@/types";
import type { Database } from "@/types/database";

type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];
type SubscriptionItemInsert = Database["public"]["Tables"]["subscription_items"]["Insert"];

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

/**
 * Transitions a subscription to its next lifecycle status with validation.
 * Maintained by Member 2.
 */
export async function transitionSubscriptionStatus(
  subId: string,
  nextStatus: SubscriptionStatus
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Fetch current subscription status and plan info
    const { data: sub, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_start, current_period_end, next_billing_date, plan:plans(billing_frequency, interval_count)")
      .eq("id", subId)
      .single();

    if (fetchError || !sub) {
      return { success: false, error: "Subscription not found." };
    }

    const currentStatus = sub.status as SubscriptionStatus;

    // 2. Validate allowed state machine transition
    if (!isValidTransition(currentStatus, nextStatus)) {
      const allowed = ALLOWED_TRANSITIONS[currentStatus];
      const allowedMsg = allowed && allowed.length > 0 
        ? `Allowed transitions from '${currentStatus}' are: ${allowed.join(", ")}.`
        : `'${currentStatus}' is a terminal state with no allowed transitions.`;
      return {
        success: false,
        error: `Invalid transition: cannot move from '${currentStatus}' to '${nextStatus}'. ${allowedMsg}`,
      };
    }

    // 3. Prepare typed update payload
    const now = new Date();
    const updatePayload: SubscriptionUpdate = {
      status: nextStatus,
      updated_at: now.toISOString(),
    };

    // Acceptance Criteria 4: Activating a subscription sets initial current_period_start and next_billing_date
    if (nextStatus === "active") {
      const planData = sub.plan as unknown as { billing_frequency: "monthly" | "yearly"; interval_count: number } | null;
      const frequency = planData?.billing_frequency || "monthly";
      const intervalCount = planData?.interval_count || 1;

      const nextBilling = calculateNextBillingDate(now, frequency, intervalCount);

      if (!sub.current_period_start) {
        updatePayload.current_period_start = now.toISOString();
      }
      updatePayload.current_period_end = nextBilling.toISOString();
      updatePayload.next_billing_date = nextBilling.toISOString();
    }

    // 4. Update status in Supabase
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", subId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subId}`);
    return { success: true, message: `Status updated to ${nextStatus}.` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Toggles cancel_at_period_end behavior for a subscription.
 */
export async function toggleCancelAtPeriodEnd(
  subId: string,
  cancelAtPeriodEnd: boolean
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subId}`);
    return {
      success: true,
      message: cancelAtPeriodEnd
        ? "Subscription scheduled to cancel at end of current period."
        : "Subscription cancellation removed. Will renew normally.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  startDate?: string;
  status?: SubscriptionStatus;
  items: Array<{
    variantId?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
}

/**
 * Creates a new subscription and its line items.
 */
export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    if (!input.customerId) {
      return { success: false, error: "Customer is required." };
    }
    if (!input.planId) {
      return { success: false, error: "Plan is required." };
    }
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "At least one subscription item is required." };
    }

    // Fetch plan details for period calculation
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("billing_frequency, interval_count")
      .eq("id", input.planId)
      .single();

    if (planError || !plan) {
      return { success: false, error: "Selected plan does not exist." };
    }

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const status = input.status || "draft";

    const subPayload: SubscriptionInsert = {
      customer_id: input.customerId,
      plan_id: input.planId,
      status: status,
      start_date: startDate.toISOString(),
      cancel_at_period_end: false,
    };

    if (status === "active") {
      const nextBilling = calculateNextBillingDate(
        startDate,
        plan.billing_frequency as "monthly" | "yearly",
        plan.interval_count
      );
      subPayload.current_period_start = startDate.toISOString();
      subPayload.current_period_end = nextBilling.toISOString();
      subPayload.next_billing_date = nextBilling.toISOString();
    }

    const { data: insertedSub, error: subError } = await supabase
      .from("subscriptions")
      .insert(subPayload)
      .select("id")
      .single();

    if (subError || !insertedSub) {
      return { success: false, error: subError?.message || "Failed to create subscription." };
    }

    // Insert subscription items
    const itemsPayload: SubscriptionItemInsert[] = input.items.map((item) => ({
      subscription_id: insertedSub.id,
      variant_id: item.variantId || null,
      quantity: Math.max(1, item.quantity),
      unit_price: Math.max(0, item.unitPrice),
    }));

    const { error: itemsError } = await supabase
      .from("subscription_items")
      .insert(itemsPayload);

    if (itemsError) {
      return { success: false, error: `Subscription created but items failed: ${itemsError.message}` };
    }

    revalidatePath("/subscriptions");
    return {
      success: true,
      message: "Subscription created successfully.",
      data: { id: insertedSub.id },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}
