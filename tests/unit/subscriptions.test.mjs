import { describe, it } from "node:test";
import assert from "node:assert/strict";

// State transitions map
const ALLOWED_TRANSITIONS = {
  draft: ["quotation", "confirmed"],
  quotation: ["confirmed", "closed"],
  confirmed: ["active", "closed"],
  active: ["paused", "closed"],
  paused: ["active", "closed"],
  closed: [],
};

function isValidTransition(currentStatus, nextStatus) {
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

function calculateNextBillingDate(startDate, frequency, intervalCount = 1) {
  const next = new Date(startDate.getTime());
  if (frequency === "yearly") {
    next.setFullYear(next.getFullYear() + Math.max(1, intervalCount));
  } else {
    next.setMonth(next.getMonth() + Math.max(1, intervalCount));
  }
  return next;
}

function calculateSubscriptionTotal(basePrice, priceAdjustment, quantity) {
  const unitPrice = Math.max(0, Number(basePrice) + Number(priceAdjustment));
  const safeQty = Math.max(1, Number(quantity) || 1);
  return {
    unitPrice,
    total: unitPrice * safeQty,
  };
}

describe("Subscription Lifecycle State Machine (Member 2)", () => {
  it("allows valid forward transitions according to specifications", () => {
    assert.equal(isValidTransition("draft", "quotation"), true);
    assert.equal(isValidTransition("draft", "confirmed"), true);
    assert.equal(isValidTransition("quotation", "confirmed"), true);
    assert.equal(isValidTransition("quotation", "closed"), true);
    assert.equal(isValidTransition("confirmed", "active"), true);
    assert.equal(isValidTransition("confirmed", "closed"), true);
    assert.equal(isValidTransition("active", "paused"), true);
    assert.equal(isValidTransition("active", "closed"), true);
    assert.equal(isValidTransition("paused", "active"), true);
    assert.equal(isValidTransition("paused", "closed"), true);
  });

  it("blocks invalid transitions and terminal state changes", () => {
    // Cannot jump directly from draft to active without confirmation
    assert.equal(isValidTransition("draft", "active"), false);
    // Closed is a terminal state
    assert.equal(isValidTransition("closed", "active"), false);
    assert.equal(isValidTransition("closed", "draft"), false);
    assert.equal(isValidTransition("closed", "confirmed"), false);
    // Cannot jump from quotation to active
    assert.equal(isValidTransition("quotation", "active"), false);
  });
});

describe("Subscription Next Billing Date Calculation (Member 2)", () => {
  it("accurately advances monthly billing cycles", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    const next1Month = calculateNextBillingDate(start, "monthly", 1);
    assert.equal(next1Month.toISOString().split("T")[0], "2026-02-15");

    const next3Months = calculateNextBillingDate(start, "monthly", 3);
    assert.equal(next3Months.toISOString().split("T")[0], "2026-04-15");
  });

  it("accurately advances annual billing cycles", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    const next1Year = calculateNextBillingDate(start, "yearly", 1);
    assert.equal(next1Year.toISOString().split("T")[0], "2027-01-15");

    const next2Years = calculateNextBillingDate(start, "yearly", 2);
    assert.equal(next2Years.toISOString().split("T")[0], "2028-01-15");
  });
});

describe("Product Variant and Pricing Calculations (Member 2)", () => {
  it("calculates unit price with positive variant adjustment", () => {
    const { unitPrice, total } = calculateSubscriptionTotal(1000, 500, 3);
    assert.equal(unitPrice, 1500);
    assert.equal(total, 4500);
  });

  it("calculates unit price with zero variant adjustment", () => {
    const { unitPrice, total } = calculateSubscriptionTotal(1200, 0, 2);
    assert.equal(unitPrice, 1200);
    assert.equal(total, 2400);
  });

  it("calculates unit price with discount adjustment without dipping below zero", () => {
    const { unitPrice, total } = calculateSubscriptionTotal(100, -150, 1);
    assert.equal(unitPrice, 0);
    assert.equal(total, 0);
  });
});

