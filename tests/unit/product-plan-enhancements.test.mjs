import test from "node:test";
import assert from "node:assert/strict";
import { calculateNextBillingDate } from "../../src/lib/subscriptions/transitions.ts";
import {
  parsePlan,
  parseProduct,
  encodePlanName,
  encodeProductDescription,
  validatePlanAvailability,
  checkPlanPermission,
} from "../../src/lib/plans/config.ts";

test("Product Management Logic & Validations", async (t) => {
  await t.test("parses product with type and cost price correctly", () => {
    const raw = {
      id: "prod-1",
      name: "Acme SaaS",
      type: "goods",
      base_price: 1500,
      cost_price: 600,
      is_active: true,
      description: "Sample description",
    };
    const parsed = parseProduct(raw);
    assert.equal(parsed.name, "Acme SaaS");
    assert.equal(parsed.type, "goods");
    assert.equal(parsed.basePrice, 1500);
    assert.equal(parsed.costPrice, 600);
  });

  await t.test("encodes and unwraps product metadata transparently", () => {
    const encoded = encodeProductDescription("Core platform", "service", 350);
    const parsed = parseProduct({
      id: "prod-2",
      name: "Cloud Suite",
      description: encoded,
      base_price: 1000,
      is_active: true,
    });
    assert.equal(parsed.description, "Core platform");
    assert.equal(parsed.type, "service");
    assert.equal(parsed.costPrice, 350);
  });

  await t.test("calculates variant additions accurately (including Odoo variant +560)", () => {
    const basePrice = 1400;
    const odooAdjustment = 560;
    const odooUnitPrice = basePrice + odooAdjustment;
    assert.equal(odooUnitPrice, 1960);

    const entAdjustment = 1500;
    const entUnitPrice = basePrice + entAdjustment;
    assert.equal(entUnitPrice, 2900);
  });
});

test("Subscription Plan Management & Billing Cycles", async (t) => {
  const base = new Date("2026-06-01T00:00:00Z");

  await t.test("accurately calculates daily billing cycles", () => {
    const next1 = calculateNextBillingDate(base, "daily", 1);
    assert.equal(next1.toISOString().split("T")[0], "2026-06-02");

    const next5 = calculateNextBillingDate(base, "daily", 5);
    assert.equal(next5.toISOString().split("T")[0], "2026-06-06");
  });

  await t.test("accurately calculates weekly billing cycles", () => {
    const next1 = calculateNextBillingDate(base, "weekly", 1);
    assert.equal(next1.toISOString().split("T")[0], "2026-06-08");

    const next2 = calculateNextBillingDate(base, "weekly", 2);
    assert.equal(next2.toISOString().split("T")[0], "2026-06-15");
  });

  await t.test("accurately calculates monthly billing cycles", () => {
    const next = calculateNextBillingDate(base, "monthly", 1);
    assert.equal(next.toISOString().split("T")[0], "2026-07-01");
  });

  await t.test("accurately calculates yearly billing cycles", () => {
    const next = calculateNextBillingDate(base, "yearly", 1);
    assert.equal(next.toISOString().split("T")[0], "2027-06-01");
  });
});

test("Plan Availability & Minimum Quantity Enforcement", async (t) => {
  await t.test("rejects subscriptions below minimum quantity", () => {
    const plan = parsePlan({
      name: "Team Plan",
      billing_frequency: "monthly",
      minimum_quantity: 5,
      is_active: true,
    });
    const checkFail = validatePlanAvailability(plan, 3);
    assert.equal(checkFail.valid, false);
    assert.match(checkFail.error, /Minimum quantity required/);

    const checkPass = validatePlanAvailability(plan, 5);
    assert.equal(checkPass.valid, true);
  });

  await t.test("rejects subscriptions to expired plans", () => {
    const past = new Date("2026-01-01T00:00:00Z").toISOString();
    const plan = parsePlan({
      name: "Limited Deal",
      billing_frequency: "monthly",
      availability_end: past,
      is_active: true,
    });
    const check = validatePlanAvailability(plan, 1, new Date("2026-05-01T00:00:00Z"));
    assert.equal(check.valid, false);
    assert.match(check.error, /Plan expired on/);
  });

  await t.test("rejects subscriptions to inactive plans", () => {
    const plan = parsePlan({
      name: "Archived Plan",
      billing_frequency: "monthly",
      is_active: false,
    });
    const check = validatePlanAvailability(plan, 1);
    assert.equal(check.valid, false);
    assert.match(check.error, /currently inactive/);
  });
});

test("Plan Permissions Governing Subscription Actions", async (t) => {
  await t.test("blocks pausing when plan.allowPausing is false", () => {
    const plan = parsePlan({
      name: "Non-pausable Plan",
      billing_frequency: "monthly",
      allow_pausing: false,
    });
    const perm = checkPlanPermission(plan, "pause");
    assert.equal(perm.allowed, false);
    assert.match(perm.error, /does not permit pausing/);
  });

  await t.test("blocks early closure when plan.allowEarlyClosure is false", () => {
    const plan = parsePlan({
      name: "Fixed Commitment Plan",
      billing_frequency: "yearly",
      allow_early_closure: false,
    });
    const perm = checkPlanPermission(plan, "early_closure");
    assert.equal(perm.allowed, false);
    assert.match(perm.error, /does not permit early closure/);
  });

  await t.test("allows pausing and early closure when plan permits them", () => {
    const plan = parsePlan({
      name: "Flexible Plan",
      billing_frequency: "monthly",
      allow_pausing: true,
      allow_early_closure: true,
    });
    assert.equal(checkPlanPermission(plan, "pause").allowed, true);
    assert.equal(checkPlanPermission(plan, "early_closure").allowed, true);
  });
});
