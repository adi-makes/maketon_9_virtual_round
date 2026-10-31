# SubscriptIQ — Environment Variables Policy

This document catalogs every environment variable used in **SubscriptIQ**, its purpose, security boundary, and where to obtain its value.

---

## 🔒 Mandatory Root Environment Policy

1. **Root Placement Only**: All environment files (`.env.example`, `.env.local`) must reside strictly in the repository root directory.
2. **Disallowed**: Never create nested `.env` files in `src/`, `team/member-*`, `public/`, or any subdirectory.
3. **No Tracked Secrets**: Never commit `.env.local` to Git. The `.gitignore` file enforces this automatically.

---

## 📋 Variable Catalog

| Variable                               |           Scope           | Required? | Purpose                                                         | Where to Obtain                                                                                       |
| :------------------------------------- | :-----------------------: | :-------: | :-------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Public / Client & Server  |  **Yes**  | Project HTTPS API endpoint for Supabase                         | Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project URL                              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public / Client & Server  |  **Yes**  | Anonymous publishable API key for queries guarded by RLS        | Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project API keys (`anon` / `public`)     |
| `SUPABASE_SECRET_KEY`                  | **Server-Only (Private)** | Optional  | Service role key for privileged background administrative tasks | Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; `service_role` (Never expose to browser) |
| `NEXT_PUBLIC_APP_NAME`                 |          Public           | Optional  | Application title displayed in header and emails                | Defaults to `SubscriptIQ`                                                                             |
| `NEXT_PUBLIC_APP_URL`                  |          Public           | Optional  | Canonical base URL for redirects and links                      | `http://localhost:3000` for local development                                                         |

---

## 🧪 Validation Commands

Check your local environment at any time:

```bash
# Verify .env.local exists and has valid Supabase credentials
npm run check:env

# Ensure no rogue or nested .env files exist in subfolders
npm run check:env-files
```
