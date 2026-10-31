import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateInvoice,
  calculatePaymentApplication,
} from "../../src/lib/billing/calculations.ts";

/**
 * Pure Domain Rule Helpers (Mirroring generator.ts & invoice-service.ts invariants)
 */
function isSubscriptionEligibleForBilling(status) {
  return status === "active" || status === "confirmed";
}

function computeBillingPeriod(startDate, frequency, intervalCount = 1) {
  const start = new Date(startDate.getTime());
  const end = new Date(start.getTime());

  if (frequency === "yearly") {
    end.setFullYear(end.getFullYear() + Math.max(1, intervalCount));
  } else {
    // Calendar month handling
    const originalDay = start.getDate();
    end.setMonth(end.getMonth() + Math.max(1, intervalCount));

    // If month rollover clipped (e.g. Jan 31 to Feb 28), handle end of month
    if (end.getDate() !== originalDay && end.getDate() < 4) {
      end.setDate(0); // set to last day of previous month
    }
  }

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function checkDuplicatePeriod(existingInvoices, subId, startIso, endIso) {
  return existingInvoices.some(
    (inv) =>
      inv.subscription_id === subId &&
      inv.billing_period_start === startIso &&
      inv.billing_period_end === endIso
  );
}

describe("Automated Billing Engine Lifecycle (Member 3)", () => {
  // 1. Subscription eligibility
  it("permits billing only for active and confirmed subscriptions", () => {
    assert.equal(isSubscriptionEligibleForBilling("active"), true);
    assert.equal(isSubscriptionEligibleForBilling("confirmed"), true);
  });

  it("strictly skips ineligible subscriptions (draft, quotation, paused, closed)", () => {
    assert.equal(isSubscriptionEligibleForBilling("draft"), false);
    assert.equal(isSubscriptionEligibleForBilling("quotation"), false);
    assert.equal(isSubscriptionEligibleForBilling("paused"), false);
    assert.equal(isSubscriptionEligibleForBilling("closed"), false);
  });

  // 2. Billing period and calendar arithmetic
  it("accurately calculates standard monthly billing boundaries", () => {
    const start = new Date("2026-03-01T00:00:00Z");
    const { startIso, endIso } = computeBillingPeriod(start, "monthly", 1);

    assert.equal(startIso, "2026-03-01T00:00:00.000Z");
    assert.equal(endIso, "2026-04-01T00:00:00.000Z");
  });

  it("handles annual billing period intervals", () => {
    const start = new Date("2026-05-15T00:00:00Z");
    const { startIso, endIso } = computeBillingPeriod(start, "yearly", 1);

    assert.equal(startIso, "2026-05-15T00:00:00.000Z");
    assert.equal(endIso, "2027-05-15T00:00:00.000Z");
  });

  // 3. Duplicate Billing Protection (Idempotency)
  it("detects existing period and prevents duplicate invoice generation", () => {
    const existingInvoices = [
      {
        id: "inv-1",
        subscription_id: "sub-123",
        billing_period_start: "2026-01-01T00:00:00.000Z",
        billing_period_end: "2026-02-01T00:00:00.000Z",
      },
    ];

    // Attempting to bill same period again
    const isDuplicate = checkDuplicatePeriod(
      existingInvoices,
      "sub-123",
      "2026-01-01T00:00:00.000Z",
      "2026-02-01T00:00:00.000Z"
    );
    assert.equal(isDuplicate, true);

    // Attempting to bill next period is allowed
    const isNextPeriodDuplicate = checkDuplicatePeriod(
      existingInvoices,
      "sub-123",
      "2026-02-01T00:00:00.000Z",
      "2026-03-01T00:00:00.000Z"
    );
    assert.equal(isNextPeriodDuplicate, false);
  });
});

describe("Payment Recording and Reconciliation (Member 3)", () => {
  it("settles invoice in full when exact outstanding balance is received", () => {
    const totalAmount = 1180; // ₹1,000 + 18% GST
    const currentPaid = 0;
    const payment = 1180;

    const result = calculatePaymentApplication(totalAmount, currentPaid, payment);
    assert.equal(result.newPaidAmount, 1180);
    assert.equal(result.newOutstandingBalance, 0);
    assert.equal(result.newStatus, "paid");
  });

  it("handles multi-step partial payments sequentially", () => {
    const totalAmount = 5000;

    // Step 1: First payment of ₹2,000
    const step1 = calculatePaymentApplication(totalAmount, 0, 2000);
    assert.equal(step1.newPaidAmount, 2000);
    assert.equal(step1.newOutstandingBalance, 3000);
    assert.equal(step1.newStatus, "partially_paid");

    // Step 2: Second payment of ₹1,500
    const step2 = calculatePaymentApplication(totalAmount, step1.newPaidAmount, 1500);
    assert.equal(step2.newPaidAmount, 3500);
    assert.equal(step2.newOutstandingBalance, 1500);
    assert.equal(step2.newStatus, "partially_paid");

    // Step 3: Final settlement of remaining ₹1,500
    const step3 = calculatePaymentApplication(totalAmount, step2.newPaidAmount, 1500);
    assert.equal(step3.newPaidAmount, 5000);
    assert.equal(step3.newOutstandingBalance, 0);
    assert.equal(step3.newStatus, "paid");
  });

  it("blocks overpayment with an explicit error", () => {
    const totalAmount = 2000;
    const currentPaid = 1800; // outstanding is ₹200
    const invalidOverpayment = 201;

    assert.throws(
      () => calculatePaymentApplication(totalAmount, currentPaid, invalidOverpayment),
      RangeError
    );
  });

  it("blocks non-positive payment amounts", () => {
    assert.throws(() => calculatePaymentApplication(1000, 0, 0), RangeError);
    assert.throws(() => calculatePaymentApplication(1000, 0, -50), RangeError);
  });
});
