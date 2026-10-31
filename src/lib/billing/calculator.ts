export interface CalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export function calculateInvoiceTotals(
  items: { quantity: number; unitPrice: number }[],
  discountPercent: number = 0,
  taxRatePercent: number = 18
): CalculationResult {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number(((taxableAmount * taxRatePercent) / 100).toFixed(2));
  const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

  return { subtotal, discountAmount, taxableAmount, taxAmount, totalAmount };
}
