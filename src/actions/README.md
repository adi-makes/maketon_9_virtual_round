# Next.js Server Actions Conventions

This directory contains Next.js Server Actions (`"use server"`) for mutating data and orchestrating backend operations in **SubscriptIQ**.

---

## 📁 Action Modules

- [`subscriptions.ts`](file:///c:/Developments/subscriptiq/src/actions/subscriptions.ts): State machine transitions for subscriptions (`draft` &rarr; `quotation` &rarr; `confirmed` &rarr; `active` &rarr; `closed`).
- [`payments.ts`](file:///c:/Developments/subscriptiq/src/actions/payments.ts): Payment transaction recording, invoice balance deduction, and status updates.

---

## 🛡️ Coding Standards for Server Actions

1. **Directive**: Every file must start with `"use server";` at line 1.
2. **Authorization**: Always use `createClient()` from `@/lib/supabase/server`. The client automatically sends user cookies, allowing PostgreSQL Row-Level Security (RLS) to enforce data boundaries.
3. **Response Envelope**: Actions should return a typed response using `ActionResponse<T>` from `@/types`:
   ```typescript
   export interface ActionResponse<T = unknown> {
     success: boolean;
     message?: string;
     data?: T;
     error?: string;
   }
   ```
4. **Cache Invalidation**: Call `revalidatePath("/route")` after successful mutations to ensure Next.js displays fresh server-rendered data.
5. **No Secret Leaks**: Never return raw SQL exception stack traces to client components.
