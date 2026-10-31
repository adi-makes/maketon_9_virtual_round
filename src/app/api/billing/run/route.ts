import { NextResponse } from "next/server";
import { runBillingCycle } from "@/lib/billing/generator";

export const dynamic = "force-dynamic";

/**
 * API route to trigger the automated recurring billing run.
 * Suitable for scheduled cron jobs (e.g. Vercel Cron) or administrative webhooks.
 */
export async function POST() {
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
      message: "SubscriptIQ Billing Engine Endpoint. Send POST to trigger billing run.",
    },
    { status: 200 }
  );
}
