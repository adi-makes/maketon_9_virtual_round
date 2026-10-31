import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeToMonthlyPaise,
  calculateSubscriptionRecurringPaise,
  aggregateDashboardMetrics,
} from "../../src/lib/billing/dashboard-calculations.ts";

describe("Dashboard Financial Metrics Engine", () => {
  // Test A: No billing data
  it("Test A: handles empty database with zero values across all metrics", () => {
    const metrics = aggregateDashboardMetrics({
      subscriptions: [],
      invoices: [],
      payments: [],
      customersCount: 0,
      now: new Date("2026-10-31T12:00:00Z"),
    });

    assert.equal(metrics.activeSubscriptionsCount, 0);
    assert.equal(metrics.totalRevenue, 0);
    assert.equal(metrics.grossCollected, 0);
    assert.equal(metrics.invoicedRevenue, 0);
    assert.equal(metrics.outstandingReceivables, 0);
    assert.equal(metrics.overdueInvoicesCount, 0);
    assert.equal(metrics.mrr, 0);
    assert.equal(metrics.totalCustomersCount, 0);
    assert.equal(metrics.totalSubscriptionsCount, 0);
    assert.equal(metrics.recentSubscriptions.length, 0);
    assert.equal(metrics.recentSettlements.length, 0);
    assert.equal(metrics.timeSeriesStats.length, 6);
    assert.equal(metrics.timeSeriesStats[5].net_revenue, 0);
    assert.equal(metrics.timeSeriesStats[5].mrr, 0);
  });

  // Test B: Active monthly subscription
  it("Test B: accurately accounts for an active monthly subscription", () => {
    const sub = {
      id: "sub-1",
      customer_id: "cust-1",
      status: "active",
      start_date: "2026-10-01T00:00:00Z",
      plan: {
        billing_frequency: "monthly",
        interval_count: 1,
        product: { base_price: 1500 },
      },
      items: [{ quantity: 1, unit_price: 1500 }],
    };

    const metrics = aggregateDashboardMetrics({
      subscriptions: [sub],
      invoices: [],
      payments: [],
      customersCount: 1,
      now: new Date("2026-10-31T12:00:00Z"),
    });

    assert.equal(metrics.activeSubscriptionsCount, 1);
    assert.equal(metrics.mrr, 1500);
    assert.equal(metrics.totalRevenue, 0, "Collected revenue does not change merely because subscription was created");
    assert.equal(metrics.outstandingReceivables, 0, "Receivables do not change without an invoice");
  });

  // Test C: Annual subscription MRR normalization
  it("Test C: normalizes annual subscription to monthly MRR (annual / 12)", () => {
    const sub = {
      id: "sub-annual",
      customer_id: "cust-1",
      status: "active",
      start_date: "2026-10-01T00:00:00Z",
      plan: {
        billing_frequency: "yearly",
        interval_count: 1,
        product: { base_price: 12000 },
      },
      items: [{ quantity: 1, unit_price: 12000 }],
    };

    const metrics = aggregateDashboardMetrics({
      subscriptions: [sub],
      invoices: [],
      payments: [],
      customersCount: 1,
      now: new Date("2026-10-31T12:00:00Z"),
    });

    assert.equal(metrics.activeSubscriptionsCount, 1);
    assert.equal(metrics.mrr, 1000, "12,000/yr must normalize to exactly 1,000/mo MRR");
  });

  // Test D: Invoice generated without payment
  it("Test D: records invoiced revenue and outstanding receivables without inflating collected cash", () => {
    const inv = {
      id: "inv-1",
      invoice_number: "INV-2026-001",
      subscription_id: "sub-1",
      customer_id: "cust-1",
      total_amount: 1180, // e.g. 1000 + 18% GST
      paid_amount: 0,
      outstanding_balance: 1180,
      status: "confirmed",
      due_date: "2026-11-15T00:00:00Z",
      created_at: "2026-10-31T00:00:00Z",
    };

    const metrics = aggregateDashboardMetrics({
      subscriptions: [],
      invoices: [inv],
      payments: [],
      customersCount: 1,
      now: new Date("2026-10-31T12:00:00Z"),
    });

    assert.equal(metrics.invoicedRevenue, 1180);
    assert.equal(metrics.outstandingReceivables, 1180);
    assert.equal(metrics.totalRevenue, 0, "Uncollected invoice does not count as cash collected");
    assert.equal(metrics.overdueInvoicesCount, 0, "Future due date must not be counted as overdue");
  });

  // Test E: Partial payment reconciliation
  it("Test E: correctly applies partial payment: increases collections and reduces receivables", () => {
    const inv = {
      id: "inv-1",
      invoice_number: "INV-2026-001",
      subscription_id: "sub-1",
      customer_id: "cust-1",
      total_amount: 1000,
      paid_amount: 400,
      outstanding_balance: 600,
      status: "partially_paid",
      due_date: "2026-10-15T00:00:00Z", // past due!
      created_at: "2026-10-01T00:00:00Z",
    };

    const pay = {
      id: "pay-1",
      payment_number: "PAY-2026-001",
      invoice_id: "inv-1",
      customer_id: "cust-1",
      amount: 400,
      status: "completed",
      created_at: "2026-10-10T00:00:00Z",
    };

    const metrics = aggregateDashboardMetrics({
      subscriptions: [],
      invoices: [inv],
      payments: [pay],
      customersCount: 1,
      now: new Date("2026-10-31T12:00:00Z"),
    });

    assert.equal(metrics.totalRevenue, 400);
    assert.equal(metrics.outstandingReceivables, 600);
    assert.equal(metrics.invoicedRevenue, 1000);
    assert.equal(metrics.overdueInvoicesCount, 1, "Past due invoice with balance > 0 counts as overdue");
  });

  // Test F: Final payment settling invoice
  it("Test F: settles invoice to zero balance and removes it from overdue count", () => {
    const inv = {
      id: "inv-1",
      invoice_number: "INV-2026-001",
      subscription_id: "sub-1",
      customer_id: "cust-1",
      total_amount: 1000,
      paid_amount: 1000,
      outstanding_balance: 0,
      status: "paid",
      due_date: "2026-10-15T00:00:00Z", // was past due, but fully paid!
      created_at: "2026-10-01T00:00:00Z",
    };

    const pay1 = {
      id: "pay-1",
      amount: 400,
      status: "completed",
      created_at: "2026-10-10T00:00:00Z",
    };

    const pay2 = {
      id: "pay-2",
      amount: 600,
      status: "completed",
      created_at: "2026-10-20T00:00:00Z",
    };

    const metrics = aggregateDashboardMetrics({
      subscriptions: [],
      invoices: [inv],
      payments: [pay1, pay2],
      customersCount: 1,
      now: new Date("2026-10-31T12:00:00Z"),
    });

    assert.equal(metrics.totalRevenue, 1000);
    assert.equal(metrics.outstandingReceivables, 0, "Outstanding balance must be exactly 0");
    assert.equal(metrics.overdueInvoicesCount, 0, "Fully paid invoice must never count as overdue");
  });

  // Test G: Failed and pending payments
  it("Test G: excludes failed and pending payments from qualifying collected revenue", () => {
    const payPending = {
      id: "pay-pend",
      amount: 500,
      status: "pending",
      created_at: "2026-10-25T00:00:00Z",
    };

    const payFailed = {
      id: "pay-fail",
      amount: 800,
      status: "failed",
      created_at: "2026-10-26T00:00:00Z",
    };

    const payCompleted = {
      id: "pay-ok",
      amount: 300,
      status: "completed",
      created_at: "2026-10-27T00:00:00Z",
    };

    const metrics = aggregateDashboardMetrics({
      subscriptions: [],
      invoices: [],
      payments: [payPending, payFailed, payCompleted],
      customersCount: 1,
      now: new Date("2026-10-31T12:00:00Z"),
    });

    assert.equal(metrics.totalRevenue, 300, "Only completed payments qualify for collected revenue");
  });

  // Test H: Refunds deduction from net collections
  it("Test H: subtracts refunded payments from gross to compute net collected revenue", () => {
    const pay1 = {
      id: "pay-1",
      amount: 1000,
      status: "completed",
      created_at: "2026-10-01T00:00:00Z",
    };

    const pay2 = {
      id: "pay-refund",
      amount: 250,
      status: "refunded",
      created_at: "2026-10-15T00:00:00Z",
    };

    const metrics = aggregateDashboardMetrics({
      subscriptions: [],
      invoices: [],
      payments: [pay1, pay2],
      customersCount: 1,
      now: new Date("2026-10-31T12:00:00Z"),
    });

    assert.equal(metrics.grossCollected, 1000);
    assert.equal(metrics.refundedAmount, 250);
    assert.equal(metrics.totalRevenue, 750, "Net revenue = 1,000 - 250 = 750");
  });

  // Test K: Billing interval normalization across cadences
  it("Test K: normalizes daily, weekly, quarterly, and annual billing intervals correctly", () => {
    // 100 INR/day: (100 * 365) / 12 = 3041.67 INR/mo -> 304167 paise
    const dailyPaise = normalizeToMonthlyPaise(10000, "daily", 1);
    assert.equal(dailyPaise, 304167);

    // 700 INR/week: (700 * 52) / 12 = 3033.33 INR/mo -> 303333 paise
    const weeklyPaise = normalizeToMonthlyPaise(70000, "weekly", 1);
    assert.equal(weeklyPaise, 303333);

    // 3,000 INR quarterly (monthly with count=3): 3,000 / 3 = 1,000 INR/mo
    const quarterlyPaise = normalizeToMonthlyPaise(300000, "monthly", 3);
    assert.equal(quarterlyPaise, 100000);

    // 24,000 INR biennial (yearly with count=2): 24,000 / 24 = 1,000 INR/mo
    const biennialPaise = normalizeToMonthlyPaise(2400000, "yearly", 2);
    assert.equal(biennialPaise, 100000);
  });

  // Test M: Inactive/paused subscriptions do not contribute to MRR
  it("Test M: excludes draft, quotation, paused, and closed subscriptions from active count and MRR", () => {
    const subs = [
      { id: "s1", status: "active", plan: { billing_frequency: "monthly", product: { base_price: 1000 } } },
      { id: "s2", status: "paused", plan: { billing_frequency: "monthly", product: { base_price: 2000 } } },
      { id: "s3", status: "draft", plan: { billing_frequency: "monthly", product: { base_price: 3000 } } },
      { id: "s4", status: "closed", plan: { billing_frequency: "monthly", product: { base_price: 4000 } } },
      { id: "s5", status: "quotation", plan: { billing_frequency: "monthly", product: { base_price: 5000 } } },
    ];

    const metrics = aggregateDashboardMetrics({
      subscriptions: subs,
      invoices: [],
      payments: [],
      customersCount: 5,
      now: new Date("2026-10-31T12:00:00Z"),
    });

    assert.equal(metrics.activeSubscriptionsCount, 1);
    assert.equal(metrics.totalSubscriptionsCount, 5);
    assert.equal(metrics.mrr, 1000);
    assert.equal(metrics.subscriptionDistribution.active, 1);
    assert.equal(metrics.subscriptionDistribution.paused, 1);
    assert.equal(metrics.subscriptionDistribution.other, 3);
  });
});
