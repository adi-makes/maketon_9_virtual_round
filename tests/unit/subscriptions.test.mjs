import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatSubscriptionDisplay } from "../../src/lib/subscriptions/display.ts";

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

describe("Live Subscription Listing & Record Transformation (Member 2)", () => {
  it("transforms raw database subscription with joined relations into live display item", () => {
    const rawSub = {
      id: "32f8834b-a7a6-4bff-b3bc-4ec4c30fb2b1",
      customer_id: "cust-uuid-1",
      plan_id: "plan-uuid-1",
      status: "active",
      start_date: "2026-10-31T06:59:21.759Z",
      current_period_start: "2026-10-31T06:59:21.759Z",
      current_period_end: "2026-11-30T06:59:21.759Z",
      next_billing_date: "2026-11-30T06:59:21.759Z",
      cancel_at_period_end: false,
      created_at: "2026-10-31T06:59:24.370Z",
      customer: {
        id: "cust-uuid-1",
        name: "Sarah Connor",
        email: "sarah.connor@cyberdyne.io",
        phone: "+91 98765 43210",
        company_name: "Cyberdyne Systems",
      },
      plan: {
        id: "plan-uuid-1",
        name: "Monthly Standard Plan",
        billing_frequency: "monthly",
        product: {
          id: "prod-uuid-1",
          name: "SubscriptIQ Cloud Suite",
          base_price: 1000,
        },
      },
      items: [
        {
          id: "item-1",
          quantity: 2,
          unit_price: 1000,
          variant: { id: "var-1", name: "Enterprise Seat" },
        },
      ],
      invoices: [],
    };

    const item = formatSubscriptionDisplay(rawSub);

    assert.equal(item.id, "32f8834b-a7a6-4bff-b3bc-4ec4c30fb2b1");
    assert.equal(item.code, "SUB-32F8834B");
    assert.equal(item.customer_name, "Sarah Connor");
    assert.equal(item.customer_company, "Cyberdyne Systems");
    assert.equal(item.customer_initials, "CS");
    assert.equal(item.plan_name, "Monthly Standard Plan");
    assert.equal(item.billing_cycle, "Monthly");
    assert.equal(item.amount, 2000);
    assert.equal(item.amount_cadence, "per month");
    assert.equal(item.status, "active");
    assert.equal(item.auto_renew, true);
    assert.equal(item.mandate_verified, true);
    assert.equal(item.line_items.length, 1);
    assert.equal(item.line_items[0].title, "Enterprise Seat");
  });

  it("handles cancelled subscription with cancel_at_period_end", () => {
    const rawSub = {
      id: "sub-cancel-1234",
      customer_id: "cust-1",
      plan_id: "plan-1",
      status: "active",
      start_date: "2026-01-01T00:00:00Z",
      cancel_at_period_end: true,
      customer: { name: "John Doe", company_name: "Acme Corp" },
      plan: { name: "Pro Plan", billing_frequency: "yearly" },
      items: [{ quantity: 1, unit_price: 12000 }],
    };

    const item = formatSubscriptionDisplay(rawSub);
    assert.equal(item.auto_renew, false);
    assert.equal(item.billing_cycle, "Yearly");
    assert.equal(item.amount, 12000);
    assert.equal(item.amount_cadence, "per year");
  });

  it("handles paused and closed subscriptions with proper timeline messaging", () => {
    const pausedSub = {
      id: "sub-paused-1",
      customer_id: "cust-1",
      plan_id: "plan-1",
      status: "paused",
      customer: { name: "Alice Smith" },
      plan: { name: "Starter Plan", billing_frequency: "monthly" },
      items: [],
    };
    const pausedItem = formatSubscriptionDisplay(pausedSub);
    assert.equal(pausedItem.status, "paused");
    assert.equal(pausedItem.timeline_next, "Paused");

    const closedSub = {
      id: "sub-closed-1",
      customer_id: "cust-1",
      plan_id: "plan-1",
      status: "closed",
      customer: { name: "Bob Martin" },
      plan: { name: "Starter Plan", billing_frequency: "monthly" },
      items: [],
    };
    const closedItem = formatSubscriptionDisplay(closedSub);
    assert.equal(closedItem.status, "closed");
    assert.equal(closedItem.timeline_next, "Closed");
  });

  it("handles draft and quotation statuses with pending activation timeline", () => {
    const draftSub = {
      id: "sub-draft-1",
      customer_id: "cust-1",
      plan_id: "plan-1",
      status: "draft",
      customer: { name: "Charlie Green" },
      plan: { name: "Custom Plan", billing_frequency: "monthly" },
      items: [],
    };
    const draftItem = formatSubscriptionDisplay(draftSub);
    assert.equal(draftItem.status, "draft");
    assert.equal(draftItem.timeline_next, "Pending Activation");
    assert.equal(draftItem.mandate_verified, false);
  });
});

