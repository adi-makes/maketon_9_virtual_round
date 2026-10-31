import { NextRequest, NextResponse } from "next/server";
import { runBillingCycle } from "@/lib/billing/generator";

export const dynamic = "force-dynamic";

/**
 * API route to trigger the automated recurring billing run.
 *
 * Security: requires `Authorization: Bearer <CRON_SECRET>` header.
 * Set CRON_SECRET in your environment variables (Vercel, .env.local, etc.).
 *
 * Suitable for scheduled cron jobs (e.g. Vercel Cron) or administrative webhooks.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is configured, enforce it. If unset in dev, allow with a warning.
  if (cronSecret) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Valid Bearer token required." },
        { status: 401 }
      );
    }
  } else {
    // No secret configured — warn in console but allow (dev/demo mode)
    console.warn(
      "[billing/run] CRON_SECRET is not set. Endpoint is publicly accessible. " +
        "Set CRON_SECRET in your environment to secure this endpoint."
    );
  }

  try {
    const result = await runBillingCycle();
    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        "SubscriptIQ Billing Engine Endpoint. Send POST with Authorization: Bearer <CRON_SECRET> to trigger billing run.",
      note: "Set CRON_SECRET environment variable to secure this endpoint.",
    },
    { status: 200 }
  );
}
