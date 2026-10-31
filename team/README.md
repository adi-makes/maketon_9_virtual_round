# Team Workspaces & Coordination

This directory provides dedicated operational checklists, module contracts, and implementation notes for each of the 4 hackathon team members building **SubscriptIQ**.

---

## 👥 Member Assignments & Ownership

| Member | Primary Module | Core Focus | Feature Priority |
| :--- | :--- | :--- | :---: |
| **[Member 1](file:///c:/Developments/subscriptiq/team/member-1/README.md)** | **Dashboard & Frontend Shell** | Layout, sidebar, analytics cards, revenue charts, responsive UI consistency | **P0** |
| **[Member 2](file:///c:/Developments/subscriptiq/team/member-2/README.md)** | **Products & Subscriptions** | Catalog, variants, monthly/annual plans, subscription lifecycle state transitions | **P0 & P1** |
| **[Member 3](file:///c:/Developments/subscriptiq/team/member-3/README.md)** | **Billing & Invoicing** | Automated invoice generation, tax/discount calculation, duplicate prevention, payments | **P0** |
| **[Member 4](file:///c:/Developments/subscriptiq/team/member-4/README.md)** | **Auth, Database & Portal** | Supabase Auth, profiles & roles (RBAC), RLS security policies, customer self-service portal | **P1 & Infra** |

---

## 🚫 Cardinal Rules for Hackathon Workspaces

1. **Single Next.js Codebase**: All 4 members work in the same Next.js application inside `src/`. Never initialize separate Next.js projects inside `team/`.
2. **Zero Nested Environment Files**: Never create `.env` or `.env.local` files inside member directories. The only allowed files are the root `.env.example` and `.env.local`.
3. **Coordinated Schema Changes**: Never modify `src/types/database.ts` or database tables without informing the other 3 members.
4. **Clean Git Branching**: Each member works on their designated feature branch (`feat/dashboard`, `feat/subscriptions`, `feat/billing`, `feat/auth-database`) and merges into `main` after running `npm run typecheck` and `npm run check:env-files`.
