import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateInvoice,
  calculatePaymentApplication,
  toPaise,
  toRupees,
} from "../../src/lib/billing/calculations.ts";

describe("Monetary Calculation Engine (Member 3)", () => {
  // 1. One item without discount or tax
  it("calculates one item without discount or tax", () => {
    const result = calculateInvoice({
      items: [{ quantity: 1, unitPrice: 100 }],
      discount: undefined,
      taxRules: [{ name: "Zero Tax", ratePercent: 0 }],
    });

    assert.equal(result.subtotal, 100);
    assert.equal(result.discountAmount, 0);
    assert.equal(result.taxableAmount, 100);
    assert.equal(result.taxAmount, 0);
    assert.equal(result.totalAmount, 100);
    assert.equal(result.outstandingBalance, 100);
  });

  // 2. Multiple items
  it("calculates total for multiple items with various quantities", () => {
    const result = calculateInvoice({
      items: [
        { quantity: 2, unitPrice: 500 }, // 1000
        { quantity: 3, unitPrice: 250 }, // 750
        { quantity: 1, unitPrice: 1200 }, // 1200
      ],
      discount: undefined,
      taxRules: [{ name: "Zero Tax", ratePercent: 0 }],
    });

    assert.equal(result.subtotal, 2950);
    assert.equal(result.totalAmount, 2950);
  });

  // 3. Percentage discount
  it("accurately applies a percentage discount (10% on ₹1,000 = ₹100 discount)", () => {
    const result = calculateInvoice({
      items: [{ quantity: 1, unitPrice: 1000 }],
      discount: { type: "percentage", value: 10 },
      taxRules: [{ name: "Zero Tax", ratePercent: 0 }],
    });

    assert.equal(result.subtotal, 1000);
    assert.equal(result.discountAmount, 100);
    assert.equal(result.taxableAmount, 900);
    assert.equal(result.totalAmount, 900);
  });

  // 4. Fixed-amount discount
  it("accurately applies a fixed-amount discount (₹250 on ₹1,000 = ₹750 taxable)", () => {
    const result = calculateInvoice({
      items: [{ quantity: 1, unitPrice: 1000 }],
      discount: { type: "fixed", value: 250 },
      taxRules: [{ name: "Zero Tax", ratePercent: 0 }],
    });

    assert.equal(result.subtotal, 1000);
    assert.equal(result.discountAmount, 250);
    assert.equal(result.taxableAmount, 750);
    assert.equal(result.totalAmount, 750);
  });

  // 5. Discount capped at the subtotal
  it("caps discount so taxable amount cannot become negative", () => {
    // Fixed discount ₹1,500 on ₹1,000 subtotal should be capped at ₹1,000
    const result = calculateInvoice({
      items: [{ quantity: 1, unitPrice: 1000 }],
      discount: { type: "fixed", value: 1500 },
      taxRules: [{ name: "GST 18%", ratePercent: 18 }],
    });

    assert.equal(result.subtotal, 1000);
    assert.equal(result.discountAmount, 1000);
    assert.equal(result.taxableAmount, 0);
    assert.equal(result.taxAmount, 0);
    assert.equal(result.totalAmount, 0);
  });

  it("respects explicit discount cap parameter", () => {
    // 20% on ₹1,000 would be ₹200, but cap is ₹150
    const result = calculateInvoice({
      items: [{ quantity: 1, unitPrice: 1000 }],
      discount: { type: "percentage", value: 20, cap: 150 },
      taxRules: [{ name: "Zero Tax", ratePercent: 0 }],
    });

    assert.equal(result.discountAmount, 150);
    assert.equal(result.taxableAmount, 850);
  });

  // 6. Tax after discount
  it("calculates tax strictly AFTER deducting discount", () => {
    // Subtotal: ₹1,000, 10% discount = ₹100, Taxable: ₹900. Tax @ 18% = ₹162. Total: ₹1,062.
    const result = calculateInvoice({
      items: [{ quantity: 1, unitPrice: 1000 }],
      discount: { type: "percentage", value: 10 },
      taxRules: [{ name: "GST 18%", ratePercent: 18 }],
    });

    assert.equal(result.subtotal, 1000);
    assert.equal(result.discountAmount, 100);
    assert.equal(result.taxableAmount, 900);
    assert.equal(result.taxAmount, 162);
    assert.equal(result.totalAmount, 1062);
  });

  // 7. Zero tax
  it("handles zero tax rate cleanly", () => {
    const result = calculateInvoice({
      items: [{ quantity: 2, unitPrice: 450 }],
      discount: undefined,
      taxRules: [{ name: "Tax Exempt", ratePercent: 0 }],
    });

    assert.equal(result.subtotal, 900);
    assert.equal(result.taxAmount, 0);
    assert.equal(result.totalAmount, 900);
  });

  // 8. Zero discount
  it("handles zero discount cleanly", () => {
    const result = calculateInvoice({
      items: [{ quantity: 1, unitPrice: 500 }],
      discount: { type: "percentage", value: 0 },
      taxRules: [{ name: "GST 18%", ratePercent: 18 }],
    });

    assert.equal(result.discountAmount, 0);
    assert.equal(result.taxableAmount, 500);
    assert.equal(result.taxAmount, 90);
    assert.equal(result.totalAmount, 590);
  });

  // 9. Invalid negative quantity
  it("rejects invalid negative quantity with RangeError", () => {
    assert.throws(
      () =>
        calculateInvoice({
          items: [{ quantity: -1, unitPrice: 100 }],
        }),
      RangeError
    );
  });

  it("rejects zero quantity with RangeError", () => {
    assert.throws(
      () =>
        calculateInvoice({
          items: [{ quantity: 0, unitPrice: 100 }],
        }),
      RangeError
    );
  });

  // 10. Invalid negative price
  it("rejects invalid negative unit price with RangeError", () => {
    assert.throws(
      () =>
        calculateInvoice({
          items: [{ quantity: 1, unitPrice: -50 }],
        }),
      RangeError
    );
  });

  // 11. Invalid discount rate
  it("rejects discount percentage exceeding 100% with RangeError", () => {
    assert.throws(
      () =>
        calculateInvoice({
          items: [{ quantity: 1, unitPrice: 100 }],
          discount: { type: "percentage", value: 105 },
        }),
      RangeError
    );
  });

  it("rejects negative discount rate with RangeError", () => {
    assert.throws(
      () =>
        calculateInvoice({
          items: [{ quantity: 1, unitPrice: 100 }],
          discount: { type: "percentage", value: -10 },
        }),
      RangeError
    );
  });

  // 12. Rounding boundaries
  it("accurately handles fractional rounding boundaries without float drift", () => {
    // Unit price with fractional paise: 33.33 * 3 = 99.99
    // GST 18% on 99.99 = 17.9982 => 18.00 paise
    // Total = 99.99 + 18.00 = 117.99
    const result = calculateInvoice({
      items: [{ quantity: 3, unitPrice: 33.33 }],
      taxRules: [{ name: "GST 18%", ratePercent: 18 }],
    });

    assert.equal(result.subtotal, 99.99);
    assert.equal(result.taxAmount, 18.0);
    assert.equal(result.totalAmount, 117.99);
  });

  // 13. Large amounts
  it("safely handles enterprise scale amounts without arithmetic overflow", () => {
    // ₹10,000,000 (1 crore) * 5 units = ₹50,000,000
    // GST 18% = ₹9,000,000
    // Total = ₹59,000,000
    const result = calculateInvoice({
      items: [{ quantity: 5, unitPrice: 10_000_000 }],
      taxRules: [{ name: "GST 18%", ratePercent: 18 }],
    });

    assert.equal(result.subtotal, 50_000_000);
    assert.equal(result.taxAmount, 9_000_000);
    assert.equal(result.totalAmount, 59_000_000);
  });

  // 14. Outstanding balance after a partial payment
  it("calculates outstanding balance correctly after partial payment", () => {
    // Total: ₹5,310 (₹4,500 + 18% tax ₹810)
    // Partial payment: ₹2,000
    // Remaining balance: ₹3,310
    const initial = calculateInvoice({
      items: [{ quantity: 1, unitPrice: 4500 }],
      taxRules: [{ name: "GST 18%", ratePercent: 18 }],
      paidAmount: 2000,
    });

    assert.equal(initial.totalAmount, 5310);
    assert.equal(initial.paidAmount, 2000);
    assert.equal(initial.outstandingBalance, 3310);

    // Apply second partial payment of ₹3,310
    const updated = calculatePaymentApplication(5310, 2000, 3310);
    assert.equal(updated.newPaidAmount, 5310);
    assert.equal(updated.newOutstandingBalance, 0);
    assert.equal(updated.newStatus, "paid");
  });

  it("rejects overpayment attempt greater than outstanding balance", () => {
    // Total: ₹1,000, already paid ₹800, balance is ₹200. Attempting ₹250 must fail.
    assert.throws(
      () => calculatePaymentApplication(1000, 800, 250),
      RangeError
    );
  });

  it("converts paise to rupees and vice versa with precision", () => {
    assert.equal(toPaise(100.5), 10050);
    assert.equal(toRupees(10050), 100.5);
    assert.equal(toPaise(0.01), 1);
    assert.equal(toRupees(1), 0.01);
  });
});
