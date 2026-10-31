# Supabase Client Configuration & Security Guidelines

This directory provides the central Supabase client factories for **SubscriptIQ**.

---

## 📁 Files

- [`client.ts`](file:///c:/Developments/subscriptiq/src/lib/supabase/client.ts): Browser client factory using `createBrowserClient` from `@supabase/ssr`.
- [`server.ts`](file:///c:/Developments/subscriptiq/src/lib/supabase/server.ts): Server client factory using `createServerClient` from `@supabase/ssr`.
- [`middleware.ts`](file:///c:/Developments/subscriptiq/src/lib/supabase/middleware.ts): Cookie/session refresh helper for Next.js root middleware.

---

## 🛡️ Usage Rules & Architecture

### 1. Browser-Side Client (`client.ts`)
- Use **only** in Client Components (files beginning with `"use client"`).
- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Never import or expose secret keys here.
- All database operations are filtered by PostgreSQL Row-Level Security (RLS).

```typescript
"use client";
import { createClient } from "@/lib/supabase/client";

export function SubscriptionList() {
  const supabase = createClient();
  // ...
}
```

### 2. Server-Side Client (`server.ts`)
- Use in **Server Components**, **Server Actions**, and **Route Handlers** (`/api/*`).
- Reads the current request's cookie jar via `next/headers`.
- Passes the user's active session token to PostgreSQL so that RLS is enforced based on the authenticated user's ID.

```typescript
import { createClient } from "@/lib/supabase/server";

export async function getActiveSubscriptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("subscriptions").select("*");
  return data;
}
```

### 3. Privileged Operations & Secret Keys (`SUPABASE_SECRET_KEY`)
- Never use a secret/service-role key as a shortcut around fixing RLS policies.
- If a trusted background worker (e.g. cron job billing runner) requires privileged execution, use `SUPABASE_SECRET_KEY` inside a strictly server-only module.
- Never prefix a secret key with `NEXT_PUBLIC_`.
