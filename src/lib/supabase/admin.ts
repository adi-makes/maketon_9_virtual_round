import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Creates a privileged Supabase client using the SUPABASE_SECRET_KEY (service_role secret).
 * 
 * CRITICAL SECURITY NOTICE:
 * This client bypasses Row Level Security and has administrative permissions.
 * It must NEVER be exposed or invoked on the client-side/browser.
 * Only use inside Server Actions or protected Server Components after verifying admin privileges.
 */
export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing in environment variables.");
  }

  if (!serviceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Helper to check whether the privileged service role key is present in environment.
 */
export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_SECRET_KEY.trim().length > 0);
}
