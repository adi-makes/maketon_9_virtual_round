# SubscriptIQ — Git Workflow & Branching Strategy

This guide establishes the Git branching, commit, and integration rules for the 4-member development team.

---

## 🌳 Branching Strategy

- **`main`**: The single source of truth and production branch. It must always be stable, compile without errors, and pass all typechecks.
- **Feature Branches**: Every teammate works in their assigned feature branch:
  - `feat/dashboard` &rarr; Member 1
  - `feat/subscriptions` &rarr; Member 2
  - `feat/billing` &rarr; Member 3
  - `feat/auth-database` &rarr; Member 4

---

## 🔄 Daily Workflow Sequence

### 1. Start of Feature Work

Update your local `main` before starting new work:

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature
```

### 2. Making Commits

Make small, focused commits with meaningful messages using Conventional Commits:

- `feat(dashboard): add active subscriptions metric card`
- `feat(billing): implement GST 18% calculation utility`
- `fix(subscriptions): prevent transition from closed to active`

```bash
git add .
git commit -m "feat(module): descriptive summary of changes"
```

### 3. Pre-Merge Verification (Mandatory)

Before opening a Pull Request or merging, run the pre-flight checks:

```bash
npm run typecheck
npm run check:env-files
npm run build
```

Do not push broken code that causes build failures for your teammates.

### 4. Integration & Conflict Resolution

If `main` has advanced while you were working:

```bash
git checkout feat/your-feature
git fetch origin
git merge origin/main
# Resolve any conflicts in VS Code, then:
git commit -m "chore: merge main into feature branch"
git push origin feat/your-feature
```
