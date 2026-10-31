import type { BillingFrequency, ProductType } from "@/types";

export interface PlanConfig {
  cleanName: string;
  billingFrequency: BillingFrequency;
  intervalCount: number;
  minimumQuantity: number;
  availabilityStart: string | null;
  availabilityEnd: string | null;
  autoCloseAfterExpiry: boolean;
  allowEarlyClosure: boolean;
  allowPausing: boolean;
  allowRenewal: boolean;
  isActive: boolean;
}

export interface ParsedProduct {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  basePrice: number;
  costPrice: number;
  isActive: boolean;
}

const PLAN_TAG_REGEX = /\[PLAN_CFG:(\{.*?\})\]$/;
const PRODUCT_TAG_REGEX = /\[PROD_CFG:(\{.*?\})\]$/;

/**
 * Encodes plan attributes into the name for transparent persistence across database versions.
 */
export function encodePlanName(
  cleanName: string,
  config: {
    billingFrequency: BillingFrequency;
    minimumQuantity?: number;
    availabilityStart?: string | null;
    availabilityEnd?: string | null;
    autoCloseAfterExpiry?: boolean;
    allowEarlyClosure?: boolean;
    allowPausing?: boolean;
    allowRenewal?: boolean;
  }
): string {
  const payload = {
    f: config.billingFrequency,
    mq: config.minimumQuantity && config.minimumQuantity > 1 ? config.minimumQuantity : 1,
    as: config.availabilityStart || null,
    ae: config.availabilityEnd || null,
    ac: config.autoCloseAfterExpiry === true,
    ec: config.allowEarlyClosure !== false,
    p: config.allowPausing !== false,
    r: config.allowRenewal !== false,
  };
  return `${cleanName.trim()} [PLAN_CFG:${JSON.stringify(payload)}]`;
}

/**
 * Parses raw plan database row into domain PlanConfig.
 */
export function parsePlan(raw: {
  id?: string;
  name: string;
  billing_frequency?: string;
  interval_count?: number;
  is_active?: boolean;
  minimum_quantity?: number;
  availability_start?: string | null;
  availability_end?: string | null;
  auto_close_after_expiry?: boolean;
  allow_early_closure?: boolean;
  allow_pausing?: boolean;
  allow_renewal?: boolean;
}): PlanConfig {
  let cleanName = raw.name || "";
  let billingFrequency: BillingFrequency =
    (raw.billing_frequency as BillingFrequency) || "monthly";
  let intervalCount = Math.max(1, raw.interval_count || 1);
  let minimumQuantity = raw.minimum_quantity ?? 1;
  let availabilityStart = raw.availability_start || null;
  let availabilityEnd = raw.availability_end || null;
  let autoCloseAfterExpiry = raw.auto_close_after_expiry ?? false;
  let allowEarlyClosure = raw.allow_early_closure ?? true;
  let allowPausing = raw.allow_pausing ?? true;
  let allowRenewal = raw.allow_renewal ?? true;
  const isActive = raw.is_active ?? true;

  const match = cleanName.match(PLAN_TAG_REGEX);
  if (match) {
    try {
      const cfg = JSON.parse(match[1]);
      cleanName = cleanName.replace(PLAN_TAG_REGEX, "").trim();
      if (cfg.f) billingFrequency = cfg.f;
      if (cfg.mq !== undefined) minimumQuantity = Number(cfg.mq);
      if (cfg.as !== undefined) availabilityStart = cfg.as;
      if (cfg.ae !== undefined) availabilityEnd = cfg.ae;
      if (cfg.ac !== undefined) autoCloseAfterExpiry = Boolean(cfg.ac);
      if (cfg.ec !== undefined) allowEarlyClosure = Boolean(cfg.ec);
      if (cfg.p !== undefined) allowPausing = Boolean(cfg.p);
      if (cfg.r !== undefined) allowRenewal = Boolean(cfg.r);
    } catch {
      // Keep defaults if parsing fails
    }
  }

  return {
    cleanName,
    billingFrequency,
    intervalCount,
    minimumQuantity: Math.max(1, minimumQuantity),
    availabilityStart,
    availabilityEnd,
    autoCloseAfterExpiry,
    allowEarlyClosure,
    allowPausing,
    allowRenewal,
    isActive,
  };
}

/**
 * Encodes product type and cost price into description for transparent persistence.
 */
export function encodeProductDescription(
  cleanDescription: string,
  type: ProductType = "service",
  costPrice: number = 0
): string {
  const payload = {
    t: type,
    c: Math.max(0, costPrice),
  };
  const trimmed = cleanDescription.trim();
  return trimmed.length > 0
    ? `${trimmed}\n\n[PROD_CFG:${JSON.stringify(payload)}]`
    : `[PROD_CFG:${JSON.stringify(payload)}]`;
}

/**
 * Parses raw product database row into ParsedProduct.
 */
export function parseProduct(raw: {
  id: string;
  name: string;
  type?: string;
  description?: string | null;
  base_price: number;
  cost_price?: number;
  is_active: boolean;
}): ParsedProduct {
  let cleanDesc = raw.description || "";
  let type: ProductType = (raw.type as ProductType) || "service";
  let costPrice: number = raw.cost_price !== undefined ? Number(raw.cost_price) : 0;

  const match = cleanDesc.match(PRODUCT_TAG_REGEX);
  if (match) {
    try {
      const cfg = JSON.parse(match[1]);
      cleanDesc = cleanDesc.replace(PRODUCT_TAG_REGEX, "").trim();
      if (cfg.t) type = cfg.t;
      if (cfg.c !== undefined) costPrice = Number(cfg.c);
    } catch {
      // Keep defaults
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    type,
    description: cleanDesc,
    basePrice: Number(raw.base_price) || 0,
    costPrice: Math.max(0, costPrice),
    isActive: Boolean(raw.is_active),
  };
}

/**
 * Validates whether a plan is available for subscription creation.
 */
export function validatePlanAvailability(
  plan: PlanConfig,
  quantity: number = 1,
  now: Date = new Date()
): { valid: boolean; error?: string } {
  if (!plan.isActive) {
    return { valid: false, error: "Cannot subscribe: This plan is currently inactive." };
  }

  if (plan.availabilityStart) {
    const start = new Date(plan.availabilityStart);
    if (now.getTime() < start.getTime()) {
      return {
        valid: false,
        error: `Cannot subscribe: Plan is not available until ${start.toLocaleDateString()}.`,
      };
    }
  }

  if (plan.availabilityEnd) {
    const end = new Date(plan.availabilityEnd);
    if (now.getTime() > end.getTime()) {
      return {
        valid: false,
        error: `Cannot subscribe: Plan expired on ${end.toLocaleDateString()}.`,
      };
    }
  }

  if (quantity < plan.minimumQuantity) {
    return {
      valid: false,
      error: `Validation error: Minimum quantity required for this plan is ${plan.minimumQuantity} (requested: ${quantity}).`,
    };
  }

  return { valid: true };
}

/**
 * Checks whether an action (pause, early close, renew) is allowed by plan permissions.
 */
export function checkPlanPermission(
  plan: PlanConfig,
  action: "pause" | "early_closure" | "renewal"
): { allowed: boolean; error?: string } {
  if (action === "pause" && !plan.allowPausing) {
    return {
      allowed: false,
      error: "Action rejected: This subscription's plan does not permit pausing.",
    };
  }
  if (action === "early_closure" && !plan.allowEarlyClosure) {
    return {
      allowed: false,
      error: "Action rejected: This subscription's plan does not permit early closure.",
    };
  }
  if (action === "renewal" && !plan.allowRenewal) {
    return {
      allowed: false,
      error: "Action rejected: This subscription's plan does not permit renewal.",
    };
  }
  return { allowed: true };
}
