/**
 * Calculator adapter module for backwards compatibility and high-level calculations.
 * Re-exports core calculation engine functions from calculations.ts.
 */

import {
  calculateInvoice,
  calculatePaymentApplication,
  toPaise,
  toRupees,
  type LineItemInput,
  type InvoiceCalculationResult,
  type DiscountSpecification,
  type TaxRuleSpecification,
} from "./calculations";

export {
  calculateInvoice,
  calculatePaymentApplication,
  toPaise,
  toRupees,
  type LineItemInput,
  type InvoiceCalculationResult,
  type DiscountSpecification,
  type TaxRuleSpecification,
};

export interface CalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Standard invoice total calculation helper.
 * Compatible with existing Member 3 interface.
 */
export function calculateInvoiceTotals(
  items: { quantity: number; unitPrice: number; description?: string }[],
  discountPercent: number = 0,
  taxRatePercent: number = 18
): CalculationResult {
  const result = calculateInvoice({
    items: items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      description: i.description,
    })),
    discount: discountPercent > 0 ? { type: "percentage", value: discountPercent } : undefined,
    taxRules: [{ name: `Tax ${taxRatePercent}%`, ratePercent: taxRatePercent }],
  });

  return {
    subtotal: result.subtotal,
    discountAmount: result.discountAmount,
    taxableAmount: result.taxableAmount,
    taxAmount: result.taxAmount,
    totalAmount: result.totalAmount,
  };
}
