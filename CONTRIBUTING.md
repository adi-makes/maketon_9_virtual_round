# SubscriptIQ — Team Contributing Guidelines

Welcome to the **SubscriptIQ** team repository! Follow these standards to ensure zero merge conflicts during the hackathon.

---

## 🌳 Branch Naming Policy

Work exclusively on your assigned module feature branch:

- **Member 1**: `feat/dashboard`
- **Member 2**: `feat/subscriptions`
- **Member 3**: `feat/billing`
- **Member 4**: `feat/auth-database`

Do not commit directly to `main`. All changes to `main` must arrive via verified integration merges.

---

## 📝 Commit Conventions

Use Conventional Commits syntax:

```text
feat(<module>): add <feature description>
fix(<module>): resolve <bug description>
docs(<module>): update <documentation section>
chore: update dependencies or scripts
```

Examples:

- `feat(dashboard): add active subscriptions revenue card`
- `feat(billing): add duplicate billing check in generator`
- `fix(auth): update session cookie expiration in middleware`

---

## 🛡️ Pre-Merge Quality Checklist

Before merging your feature branch, verify locally that your changes pass all checks:

```bash
# 1. Typecheck entire application
npm run typecheck

# 2. Verify no nested .env files exist
npm run check:env-files

# 3. Format code
npm run format

# 4. Verify production build succeeds
npm run build
```

---

## 🤝 Shared-File Coordination

The following files are shared across all 4 team members:

- `src/types/index.ts`
- `src/types/database.ts`
- `src/lib/utils.ts`
- `src/app/globals.css`
- `package.json`

**Protocol**: Before modifying any shared file, coordinate with Member 4 (DevOps Lead) to ensure no breaking changes for teammates.
