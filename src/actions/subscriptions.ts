"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { SubscriptionStatus, ActionResponse } from "@/types";
import type { Database } from "@/types/database";
import {
  ALLOWED_TRANSITIONS,
  calculateNextBillingDate,
  isValidTransition,
} from "@/lib/subscriptions/transitions";
import {
  parsePlan,
  validatePlanAvailability,
  checkPlanPermission,
} from "@/lib/plans/config";
import {
  formatSubscriptionDisplay,
  type SubscriptionDisplayItem,
  type SubscriptionLineItem,
  type SubscriptionInvoiceRecord,
} from "@/lib/subscriptions/display";

export { formatSubscriptionDisplay };
export type {
  SubscriptionDisplayItem,
  SubscriptionLineItem,
  SubscriptionInvoiceRecord,
};

async function getDbClient() {
  const admin = getAdminClient();
  if (admin) return admin;
  return await createClient();
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful no-op when outside active Next.js HTTP request
  }
}

type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];
type SubscriptionItemInsert = Database["public"]["Tables"]["subscription_items"]["Insert"];

/**
 * Transitions a subscription to its next lifecycle status with validation
 * against allowed state machine transitions AND plan permission configurations.
 */
export async function transitionSubscriptionStatus(
  subId: string,
  nextStatus: SubscriptionStatus
): Promise<ActionResponse> {
  try {
    const supabase = await getDbClient();

    // 1. Fetch current subscription status, period, and full plan configuration
    const { data: sub, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_start, current_period_end, next_billing_date, plan:plans(*)")
      .eq("id", subId)
      .single();

    if (fetchError || !sub) {
      return { success: false, error: "Subscription not found." };
    }

    const currentStatus = sub.status as SubscriptionStatus;

    // 2. Validate allowed state machine transition
    if (!isValidTransition(currentStatus, nextStatus)) {
      const allowed = ALLOWED_TRANSITIONS[currentStatus];
      const allowedMsg =
        allowed && allowed.length > 0
          ? `Allowed transitions from '${currentStatus}' are: ${allowed.join(", ")}.`
          : `'${currentStatus}' is a terminal state with no allowed transitions.`;
      return {
        success: false,
        error: `Invalid transition: cannot move from '${currentStatus}' to '${nextStatus}'. ${allowedMsg}`,
      };
    }

    // 3. Parse Plan and check Plan-Level Permissions
    const rawPlan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan;
    if (rawPlan) {
      const planConfig = parsePlan(rawPlan as Parameters<typeof parsePlan>[0]);

      if (nextStatus === "paused") {
        const perm = checkPlanPermission(planConfig, "pause");
        if (!perm.allowed) {
          return { success: false, error: perm.error || "Plan does not allow pausing." };
        }
      }

      if (nextStatus === "closed") {
        const now = new Date();
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
        const isEarlyClosure = periodEnd ? now.getTime() < periodEnd.getTime() : false;

        if (isEarlyClosure) {
          const perm = checkPlanPermission(planConfig, "early_closure");
          if (!perm.allowed) {
            return {
              success: false,
              error: perm.error || "Plan does not allow early closure before period end.",
            };
          }
        }
      }
    }

    // 4. Prepare typed update payload
    const now = new Date();
    const updatePayload: SubscriptionUpdate = {
      status: nextStatus,
      updated_at: now.toISOString(),
    };

    // If activating a subscription, calculate period start and end based on plan frequency
    if (nextStatus === "active") {
      const planConfig = rawPlan ? parsePlan(rawPlan as Parameters<typeof parsePlan>[0]) : null;
      const frequency = planConfig?.billingFrequency || "monthly";
      const intervalCount = planConfig?.intervalCount || 1;

      const nextBilling = calculateNextBillingDate(now, frequency, intervalCount);

      if (!sub.current_period_start) {
        updatePayload.current_period_start = now.toISOString();
      }
      updatePayload.current_period_end = nextBilling.toISOString();
      updatePayload.next_billing_date = nextBilling.toISOString();
    }

    // 5. Update status in Supabase
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", subId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    safeRevalidate("/subscriptions");
    safeRevalidate(`/subscriptions/${subId}`);
    safeRevalidate("/dashboard");
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
    const supabase = await getDbClient();

    // Check plan renewal permissions
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, plan:plans(*)")
      .eq("id", subId)
      .single();

    if (sub && !cancelAtPeriodEnd) {
      const rawPlan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan;
      if (rawPlan) {
        const planConfig = parsePlan(rawPlan as Parameters<typeof parsePlan>[0]);
        const perm = checkPlanPermission(planConfig, "renewal");
        if (!perm.allowed) {
          return { success: false, error: perm.error || "Plan does not allow renewals." };
        }
      }
    }

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

    safeRevalidate("/subscriptions");
    safeRevalidate(`/subscriptions/${subId}`);
    safeRevalidate("/dashboard");
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
 * Creates a new subscription, enforcing plan availability, active status,
 * minimum quantity constraints, and accurate cycle calculations.
 */
export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await getDbClient();

    if (!input.customerId) {
      return { success: false, error: "Validation error: Customer is required." };
    }
    if (!input.planId) {
      return { success: false, error: "Validation error: Plan is required." };
    }
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Validation error: At least one subscription item is required." };
    }

    // Fetch plan details
    const { data: rawPlan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", input.planId)
      .single();

    if (planError || !rawPlan) {
      return { success: false, error: "Selected plan does not exist." };
    }

    const planConfig = parsePlan(rawPlan as Parameters<typeof parsePlan>[0]);
    const totalQuantity = input.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

    // Validate Plan Availability & Minimum Quantity
    const availabilityCheck = validatePlanAvailability(planConfig, totalQuantity, new Date());
    if (!availabilityCheck.valid) {
      return { success: false, error: availabilityCheck.error || "Plan is not available." };
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
        planConfig.billingFrequency,
        planConfig.intervalCount
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

    safeRevalidate("/subscriptions");
    safeRevalidate("/dashboard");
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

/**
 * Scans active subscriptions and automatically closes those that have expired
 * and belong to plans configured with auto_close_after_expiry = true.
 */
export async function autoCloseExpiredSubscriptionsAction(): Promise<
  ActionResponse<{ closedCount: number; closedIds: string[] }>
> {
  try {
    const supabase = await getDbClient();
    const now = new Date().toISOString();

    // Query active subscriptions whose current_period_end has passed
    const { data: expiredSubs, error } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_end, plan:plans(*)")
      .eq("status", "active")
      .not("current_period_end", "is", null)
      .lt("current_period_end", now);

    if (error) {
      return { success: false, error: error.message };
    }

    const closedIds: string[] = [];

    for (const sub of expiredSubs || []) {
      const rawPlan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan;
      if (rawPlan) {
        const planConfig = parsePlan(rawPlan as Parameters<typeof parsePlan>[0]);
        if (planConfig.autoCloseAfterExpiry) {
          const { error: updateErr } = await supabase
            .from("subscriptions")
            .update({
              status: "closed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", sub.id);

          if (!updateErr) {
            closedIds.push(sub.id);
          }
        }
      }
    }

    if (closedIds.length > 0) {
      safeRevalidate("/subscriptions");
    safeRevalidate("/dashboard");
    }

    return {
      success: true,
      message: `Processed expired subscriptions. Closed ${closedIds.length} subscription(s).`,
      data: { closedCount: closedIds.length, closedIds },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Fetches all subscription records with relational joins from Supabase.
 */
export async function getSubscriptions(): Promise<ActionResponse<SubscriptionDisplayItem[]>> {
  try {
    const supabase = await createClient();

    const { data: rawSubs, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        customer_id,
        plan_id,
        status,
        start_date,
        current_period_start,
        current_period_end,
        next_billing_date,
        cancel_at_period_end,
        created_at,
        updated_at,
        customer:customers (
          id,
          name,
          email,
          company_name,
          phone,
          billing_address
        ),
        plan:plans (
          id,
          name,
          billing_frequency,
          interval_count,
          minimum_quantity,
          is_active,
          product:products (
            id,
            name,
            base_price,
            description
          )
        ),
        items:subscription_items (
          id,
          quantity,
          unit_price,
          variant:product_variants (
            id,
            name,
            price_adjustment,
            sku
          )
        ),
        invoices:invoices (
          id,
          invoice_number,
          status,
          due_date,
          total_amount,
          paid_amount,
          created_at
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const items = (rawSubs || []).map(formatSubscriptionDisplay);
    return { success: true, data: items };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}
