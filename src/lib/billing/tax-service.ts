/**
 * Tax Service for SubscriptIQ.
 * Manages tax rate retrieval, jurisdiction compliance, and historical snapshotting.
 */

import { createClient } from "@/lib/supabase/server";
import type { TaxRuleSpecification } from "./calculations";

export const DEFAULT_TAX_RULES: TaxRuleSpecification[] = [
  { name: "GST Standard 18%", ratePercent: 18.0 },
];

/**
 * Loads all active tax rules from the database.
 * Falls back to DEFAULT_TAX_RULES (18% GST) if none are defined or database query fails.
 */
export async function getActiveTaxRules(): Promise<TaxRuleSpecification[]> {
  try {
    const supabase = await createClient();
    const { data: rules, error } = await supabase
      .from("tax_rules")
      .select("name, rate_percent")
      .eq("is_active", true);

    if (error || !rules || rules.length === 0) {
      return DEFAULT_TAX_RULES;
    }

    return rules.map((r) => ({
      name: r.name,
      ratePercent: Number(r.rate_percent),
    }));
  } catch {
    return DEFAULT_TAX_RULES;
  }
}
