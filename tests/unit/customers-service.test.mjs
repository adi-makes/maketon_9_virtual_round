import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCustomerAddress,
  generateCustomerInitials,
  buildCustomerDetailRecord,
  computeCustomerDirectoryMetrics,
} from "../../src/lib/customers/service.ts";


test("Customer Initials Generator", async (t) => {
  await t.test("extracts two initials from multi-word company name", () => {
    assert.equal(generateCustomerInitials("Acme Corporation", "John Doe"), "AC");
    assert.equal(generateCustomerInitials("Bundl Technologies", "Rahul Sharma"), "BT");
  });

  await t.test("falls back to contact person name if company is not present", () => {
    assert.equal(generateCustomerInitials(null, "Sarah Connor"), "SC");
    assert.equal(generateCustomerInitials("", "Miles Dyson"), "MD");
  });

  await t.test("handles single word names gracefully", () => {
    assert.equal(generateCustomerInitials("Swiggy", ""), "SW");
  });
});

test("Customer Address Parser", async (t) => {
  await t.test("parses standard jsonb address object correctly", () => {
    const raw = {
      street: "100 Tech Blvd",
      city: "Bangalore",
      state: "KA",
      postal_code: "560001",
      country: "India",
    };
    const addr = parseCustomerAddress(raw);
    assert.equal(addr.city, "Bangalore");
    assert.equal(addr.state, "KA");
    assert.equal(addr.line1, "100 Tech Blvd");
  });

  await t.test("provides safe fallbacks for missing or empty address objects", () => {
    const addr = parseCustomerAddress(null);
    assert.equal(addr.city, "Bengaluru");
    assert.equal(addr.country, "India");
  });
});

test("Customer Record Transformation & Relational Aggregations", async (t) => {
  const mockCustomer = {
    id: "cust-test-1234",
    name: "Alex Mercer",
    email: "alex@gentek.com",
    company_name: "Gentek BioTech",
    billing_address: { city: "Bengaluru", state: "Karnataka" },
    phone: "+91 91234 56789",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await t.test("computes accurate subscription count and MRR from active subscriptions", () => {
    const rawSubs = [
      {
        id: "sub-1",
        customer_id: "cust-test-1234",
        status: "active",
        start_date: "2026-01-01T00:00:00Z",
        plan: {
          id: "plan-1",
          name: "Standard Monthly Plan",
          billing_frequency: "monthly",
          interval_count: 1,
          product: { base_price: 1500 },
        },
        items: [{ quantity: 2, unit_price: 1500 }],
      },
      {
        id: "sub-2",
        customer_id: "cust-test-1234",
        status: "paused",
        start_date: "2026-01-01T00:00:00Z",
        plan: {
          id: "plan-2",
          name: "Annual Addon",
          billing_frequency: "yearly",
          interval_count: 1,
          product: { base_price: 12000 },
        },
        items: [{ quantity: 1, unit_price: 12000 }],
      },
    ];

    const detail = buildCustomerDetailRecord(mockCustomer, rawSubs, []);
    assert.equal(detail.activeSubscriptionsCount, 1);
    assert.equal(detail.totalSubscriptionsCount, 2);
    // Sub-1: 2 * 1500 = 3000 MRR. Paused subscription excluded from active MRR.
    assert.equal(detail.mrr, 3000);
    assert.equal(detail.status, "active");
  });

  await t.test("identifies overdue invoices and transitions customer to at_risk", () => {
    const overdueDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const rawInvs = [
      {
        id: "inv-1",
        customer_id: "cust-test-1234",
        invoice_number: "INV-2026-0099",
        total_amount: 5000,
        paid_amount: 2000,
        outstanding_balance: 3000,
        status: "partially_paid",
        due_date: overdueDate,
        created_at: overdueDate,
      },
    ];

    const detail = buildCustomerDetailRecord(mockCustomer, [], rawInvs);
    assert.equal(detail.overdue, 3000);
    assert.equal(detail.ltv, 2000);
    assert.equal(detail.status, "at_risk");
    assert.equal(detail.overdueInvoiceRef, "INV-2026-0099");
  });
});

test("Customer Directory Metrics Calculations", async (t) => {
  await t.test("handles empty customers list gracefully", () => {
    const metrics = computeCustomerDirectoryMetrics([]);
    assert.equal(metrics.totalCustomers, 0);
    assert.equal(metrics.activeCustomers, 0);
    assert.equal(metrics.newThisMonth, 0);
    assert.equal(metrics.outstandingArRiskAccounts, 0);
    assert.equal(metrics.totalArRiskAmount, 0);
  });
});
