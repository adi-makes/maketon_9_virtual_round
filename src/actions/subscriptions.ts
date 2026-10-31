"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SubscriptionStatus, ActionResponse } from "@/types";

const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  draft: ["quotation", "confirmed"],
  quotation: ["confirmed", "closed"],
  confirmed: ["active", "closed"],
  active: ["paused", "closed"],
  paused: ["active", "closed"],
  closed: [],
};

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

    // 1. Fetch current subscription status
    const { data: sub, error: fetchError } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("id", subId)
      .single();

    if (fetchError || !sub) {
      return { success: false, error: "Subscription not found." };
    }

    const currentStatus = sub.status as SubscriptionStatus;

    // 2. Validate allowed state machine transition
    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
      return {
        success: false,
        error: `Invalid transition: cannot move from '${currentStatus}' to '${nextStatus}'.`,
      };
    }

    // 3. Update status in Supabase
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
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
