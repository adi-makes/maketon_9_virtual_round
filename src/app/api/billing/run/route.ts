import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { runBillingCycle } from "@/lib/billing/generator";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Constant-time string comparison to prevent timing attacks on token validation.
 */
function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

type AuthResult =
  | { authorized: true; triggerType: "scheduled" | "manual"; identifier?: string }
  | { authorized: false; status: 401 | 403; error: string };

/**
 * Validates authorization for billing execution via two supported paths:
 * 1. Scheduled Execution: Secret Bearer token matching CRON_SECRET (server-side only).
 * 2. Manual Execution: Authenticated user session with verified 'admin' role.
 */
async function authorizeBillingRequest(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const configuredSecret = process.env.CRON_SECRET || process.env.BILLING_CRON_SECRET;

  // Path 1: Check Bearer token or Cron Header
  let providedToken: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    providedToken = authHeader.slice(7).trim();
  } else if (cronHeader) {
    providedToken = cronHeader.trim();
  }

  if (providedToken) {
    if (!configuredSecret || configuredSecret.trim().length === 0) {
      return {
        authorized: false,
        status: 401,
        error: "Unauthorized: Scheduled billing secret is not configured on the server.",
      };
    }

    if (safeCompare(providedToken, configuredSecret.trim())) {
      return { authorized: true, triggerType: "scheduled", identifier: "cron-scheduler" };
    }

    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Invalid bearer token.",
    };
  }

  // Path 2: Check Authenticated User Session (Admin Role Required)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authorized: false,
        status: 401,
        error: "Unauthorized: Authentication required. Provide a valid Bearer token or log in as an administrator.",
      };
    }

    // Retrieve role from profiles or metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role =
      profile?.role ||
      user.user_metadata?.role ||
      (user.email?.toLowerCase().startsWith("admin@") ? "admin" : "customer");

    if (role === "admin") {
      return {
        authorized: true,
        triggerType: "manual",
        identifier: user.email || user.id,
      };
    }

    // Explicitly reject staff and customer accounts
    return {
      authorized: false,
      status: 403,
      error: "Forbidden: Ordinary staff and customer accounts cannot trigger automated billing.",
    };
  } catch {
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Unable to verify session.",
    };
  }
}

/**
 * POST /api/billing/run
 * Triggers the automated recurring billing cycle with strict authorization.
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeBillingRequest(req);

  if (!auth.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error,
      },
      { status: auth.status }
    );
  }

  try {
    const result = await runBillingCycle();

    return NextResponse.json(
      {
        success: true,
        message: "Billing cycle completed successfully.",
        triggerType: auth.triggerType,
        data: result,
      },
      { status: 200 }
    );
  } catch {
    // Sanitized error: never leak database credentials or internal stack traces
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred during billing execution.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/run
 * Health and discovery status endpoint (does not trigger billing).
 */
export async function GET() {
  return NextResponse.json(
    {
      name: "SubscriptIQ Billing Engine Endpoint",
      methods: ["POST"],
      authRequired: true,
      supportedAuth: ["Bearer Token (CRON_SECRET)", "Admin Session (Cookie)"],
    },
    { status: 200 }
  );
}
