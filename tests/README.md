# SubscriptIQ Testing Guide

This directory holds unit and integration test suites for SubscriptIQ.

---

## 📁 Directory Layout

- `unit/`: Pure function and isolated unit tests (e.g. `src/lib/billing/calculator.ts` tax & discount logic, subscription state transition validation).

---

## 🧪 Testing Guidelines

1. **Pure Business Logic First**: Prioritize unit tests for calculations (`calculateInvoiceTotals`), currency rounding, and state transition guards.
2. **Deterministic Inputs**: Never write tests that require live external credentials or unstable network access.
3. **Run Tests**:
   ```bash
   npm test
   ```
