/**
 * Monetary Calculation Engine for SubscriptIQ Billing Module.
 * 
 * Provides exact decimal/paise arithmetic to eliminate binary floating-point inaccuracies.
 * Supports:
 * - Line item extensions (quantity * unitPrice)
 * - Fixed & percentage discounts with caps
 * - Taxable amount determination
 * - Multi-tier percentage taxes (e.g. GST 18% = CGST 9% + SGST 9%)
 * - Outstanding balance from recognized payments
 * - Strict input validation against negative or non-finite values
 */

export interface LineItemInput {
  description?: string;
  quantity: number;
  unitPrice: number; // in rupees (e.g. 1000.50)
  discountPercent?: number;
  discountFixed?: number;
}

export interface CalculatedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface DiscountSpecification {
  type: "percentage" | "fixed";
  value: number; // percentage (0-100) or fixed amount in INR
  cap?: number; // optional maximum ceiling on discount
}

export interface TaxRuleSpecification {
  name: string;
  ratePercent: number; // e.g. 18.0 for 18%
}

export interface InvoiceCalculationInput {
  items: LineItemInput[];
  discount?: DiscountSpecification;
  taxRules?: TaxRuleSpecification[];
  paidAmount?: number;
}

export interface InvoiceCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  taxBreakdown: Array<{ name: string; ratePercent: number; amount: number }>;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  lineItems: CalculatedLineItem[];
}

/**
 * Converts a currency value in INR (e.g. 123.45) to integer paise (12345).
 * Uses Math.round after scaling to prevent floating-point representation drift.
 */
export function toPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) {
    throw new TypeError("Monetary value must be a finite number.");
  }
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise back to INR with standard two-decimal precision.
 */
export function toRupees(paise: number): number {
  if (!Number.isFinite(paise)) {
    throw new TypeError("Paise value must be a finite integer.");
  }
  return Math.round(paise) / 100;
}

export const fromPaise = toRupees;

/**
 * Validates a monetary quantity and unit price.
 */
export function validateLineItemInput(item: LineItemInput): void {
  if (!Number.isFinite(item.quantity)) {
    throw new TypeError("Quantity must be a valid number.");
  }
  if (item.quantity <= 0) {
    throw new RangeError(`Quantity must be strictly positive (received: ${item.quantity}).`);
  }
  if (!Number.isFinite(item.unitPrice)) {
    throw new TypeError("Unit price must be a valid number.");
  }
  if (item.unitPrice < 0) {
    throw new RangeError(`Unit price cannot be negative (received: ${item.unitPrice}).`);
  }
  if (item.unitPrice > 1_000_000_000) {
    throw new RangeError("Unit price exceeds maximum permitted limit.");
  }
}

/**
 * Validates discount parameters.
 */
export function validateDiscount(discount?: DiscountSpecification): void {
  if (!discount) return;
  if (!Number.isFinite(discount.value)) {
    throw new TypeError("Discount value must be a valid number.");
  }
  if (discount.value < 0) {
    throw new RangeError("Discount value cannot be negative.");
  }
  if (discount.type === "percentage") {
    if (discount.value > 100) {
      throw new RangeError(`Discount percentage cannot exceed 100% (received: ${discount.value}%).`);
    }
  }
  if (discount.cap !== undefined) {
    if (!Number.isFinite(discount.cap) || discount.cap < 0) {
      throw new RangeError("Discount cap must be a non-negative number.");
    }
  }
}

/**
 * Validates tax rules.
 */
export function validateTaxRules(rules?: TaxRuleSpecification[]): void {
  if (!rules) return;
  for (const rule of rules) {
    if (!Number.isFinite(rule.ratePercent)) {
      throw new TypeError(`Tax rate for "${rule.name}" must be a valid number.`);
    }
    if (rule.ratePercent < 0) {
      throw new RangeError(`Tax rate cannot be negative for "${rule.name}" (received: ${rule.ratePercent}%).`);
    }
    if (rule.ratePercent > 100) {
      throw new RangeError(`Tax rate cannot exceed 100% for "${rule.name}".`);
    }
  }
}

/**
 * Performs authoritative calculation for an entire invoice.
 * Calculation order:
 * 1. Line item subtotals (unitPrice * quantity)
 * 2. Invoice subtotal
 * 3. Total invoice discount (percentage or fixed, with optional cap, bounded by subtotal)
 * 4. Taxable amount (subtotal - discount)
 * 5. Applicable taxes applied to taxable amount
 * 6. Total invoice amount (taxable amount + taxes)
 * 7. Outstanding balance (total amount - paid amount, bounded >= 0)
 */
export function calculateInvoice(input: InvoiceCalculationInput): InvoiceCalculationResult {
  const { items, discount, taxRules = [{ name: "GST 18%", ratePercent: 18.0 }], paidAmount = 0 } = input;

  if (!items || items.length === 0) {
    throw new Error("Invoice must contain at least one line item.");
  }

  // 1. Validation
  validateDiscount(discount);
  validateTaxRules(taxRules);
  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    throw new RangeError("Paid amount must be a non-negative finite number.");
  }

  // 2. Line Items Calculation in Paise
  let subtotalPaise = 0;
  const calculatedItems: CalculatedLineItem[] = [];

  for (const item of items) {
    validateLineItemInput(item);
    const unitPricePaise = toPaise(item.unitPrice);
    const lineSubtotalPaise = Math.round(unitPricePaise * item.quantity);
    subtotalPaise += lineSubtotalPaise;

    calculatedItems.push({
      description: item.description || "Subscription Item",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: toRupees(lineSubtotalPaise),
      discountAmount: 0,
      taxableAmount: toRupees(lineSubtotalPaise),
      taxAmount: 0,
      totalAmount: toRupees(lineSubtotalPaise),
    });
  }

  // 3. Discount Calculation
  let discountPaise = 0;
  if (discount && discount.value > 0) {
    if (discount.type === "percentage") {
      discountPaise = Math.round((subtotalPaise * discount.value) / 100);
    } else {
      discountPaise = toPaise(discount.value);
    }

    if (discount.cap !== undefined) {
      const capPaise = toPaise(discount.cap);
      if (discountPaise > capPaise) {
        discountPaise = capPaise;
      }
    }

    // Discount cannot exceed subtotal
    if (discountPaise > subtotalPaise) {
      discountPaise = subtotalPaise;
    }
  }

  // 4. Taxable Amount
  const taxablePaise = Math.max(0, subtotalPaise - discountPaise);

  // 5. Taxes Calculation
  let totalTaxPaise = 0;
  const taxBreakdown: Array<{ name: string; ratePercent: number; amount: number }> = [];

  for (const rule of taxRules) {
    if (rule.ratePercent > 0) {
      const ruleTaxPaise = Math.round((taxablePaise * rule.ratePercent) / 100);
      totalTaxPaise += ruleTaxPaise;
      taxBreakdown.push({
        name: rule.name,
        ratePercent: rule.ratePercent,
        amount: toRupees(ruleTaxPaise),
      });
    } else {
      taxBreakdown.push({
        name: rule.name,
        ratePercent: 0,
        amount: 0,
      });
    }
  }

  // 6. Final Total
  const totalPaise = taxablePaise + totalTaxPaise;

  // 7. Balance Calculation
  const paidPaise = toPaise(paidAmount);
  const outstandingPaise = Math.max(0, totalPaise - paidPaise);

  return {
    subtotal: toRupees(subtotalPaise),
    discountAmount: toRupees(discountPaise),
    taxableAmount: toRupees(taxablePaise),
    taxAmount: toRupees(totalTaxPaise),
    taxBreakdown,
    totalAmount: toRupees(totalPaise),
    paidAmount: toRupees(paidPaise),
    outstandingBalance: toRupees(outstandingPaise),
    lineItems: calculatedItems,
  };
}

/**
 * Calculates updated invoice state after applying a new payment.
 * Validates that payment does not exceed outstanding balance.
 */
export function calculatePaymentApplication(
  totalAmount: number,
  currentPaidAmount: number,
  incomingPaymentAmount: number
): {
  newPaidAmount: number;
  newOutstandingBalance: number;
  newStatus: "paid" | "partially_paid";
} {
  if (!Number.isFinite(incomingPaymentAmount) || incomingPaymentAmount <= 0) {
    throw new RangeError("Payment amount must be greater than zero.");
  }

  const totalPaise = toPaise(totalAmount);
  const currentPaidPaise = toPaise(currentPaidAmount);
  const incomingPaise = toPaise(incomingPaymentAmount);

  const currentOutstandingPaise = Math.max(0, totalPaise - currentPaidPaise);

  if (incomingPaise > currentOutstandingPaise) {
    throw new RangeError(
      `Payment amount (₹${toRupees(incomingPaise)}) exceeds outstanding balance (₹${toRupees(currentOutstandingPaise)}). Overpayment is not allowed.`
    );
  }

  const newPaidPaise = currentPaidPaise + incomingPaise;
  const newOutstandingPaise = Math.max(0, totalPaise - newPaidPaise);

  return {
    newPaidAmount: toRupees(newPaidPaise),
    newOutstandingBalance: toRupees(newOutstandingPaise),
    newStatus: newOutstandingPaise === 0 ? "paid" : "partially_paid",
  };
}
