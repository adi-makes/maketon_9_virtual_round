import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  // Basic application-server health response (never exposes secrets or connection strings)
  const healthData = {
    status: "ok",
    app: "SubscriptIQ",
    version: "0.1.0",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp,
    environmentConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ),
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
