"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionResponse, BillingFrequency, ProductType } from "@/types";
import type { Database } from "@/types/database";
import {
  encodePlanName,
  encodeProductDescription,
  parsePlan,
  parseProduct,
} from "@/lib/plans/config";

async function getDbClient() {
  const admin = getAdminClient();
  if (admin) return admin;
  return await createClient();
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful no-op when outside Next.js request context (e.g. testing, background crons)
  }
}

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type VariantInsert = Database["public"]["Tables"]["product_variants"]["Insert"];
type PlanInsert = Database["public"]["Tables"]["plans"]["Insert"];
type PlanUpdate = Database["public"]["Tables"]["plans"]["Update"];

export interface CreateProductInput {
  name: string;
  type?: ProductType;
  description?: string;
  base_price: number;
  cost_price?: number;
  is_active?: boolean;
  variants?: Array<{
    name: string;
    price_adjustment: number;
    sku?: string;
  }>;
}

export interface UpdateProductInput {
  name?: string;
  type?: ProductType;
  description?: string;
  base_price?: number;
  cost_price?: number;
  is_active?: boolean;
}

export interface CreateVariantInput {
  product_id: string;
  name: string;
  price_adjustment: number;
  sku?: string;
}

export interface CreatePlanInput {
  product_id: string;
  name: string;
  billing_frequency: BillingFrequency;
  interval_count?: number;
  minimum_quantity?: number;
  availability_start?: string | null;
  availability_end?: string | null;
  auto_close_after_expiry?: boolean;
  allow_early_closure?: boolean;
  allow_pausing?: boolean;
  allow_renewal?: boolean;
  is_active?: boolean;
}

export interface UpdatePlanInput {
  name?: string;
  billing_frequency?: BillingFrequency;
  interval_count?: number;
  minimum_quantity?: number;
  availability_start?: string | null;
  availability_end?: string | null;
  auto_close_after_expiry?: boolean;
  allow_early_closure?: boolean;
  allow_pausing?: boolean;
  allow_renewal?: boolean;
  is_active?: boolean;
}

/**
 * Creates a new product, enforcing validations on name, sales price, and cost price.
 */
export async function createProduct(
  input: CreateProductInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await getDbClient();

    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Validation error: Product name is required." };
    }
    if (input.base_price === undefined || input.base_price === null || Number(input.base_price) < 0) {
      return { success: false, error: "Validation error: Sales price must be a non-negative number." };
    }
    const costPrice = input.cost_price !== undefined ? Number(input.cost_price) : 0;
    if (costPrice < 0) {
      return { success: false, error: "Validation error: Cost price must be a non-negative number." };
    }

    const productType: ProductType = input.type || "service";
    const rawDescription = input.description?.trim() || "";
    const encodedDescription = encodeProductDescription(rawDescription, productType, costPrice);

    const productPayload: ProductInsert = {
      name: input.name.trim(),
      type: productType,
      description: encodedDescription,
      base_price: Number(input.base_price),
      cost_price: costPrice,
      is_active: input.is_active ?? true,
    };

    // Attempt direct insert with columns; fallback if type/cost_price columns not yet added in Supabase
    let insertResult = await supabase
      .from("products")
      .insert(productPayload)
      .select("id")
      .single();

    if (insertResult.error) {
      // Fallback: exclude unmigrated columns and rely on description metadata
      const fallbackPayload: ProductInsert = {
        name: input.name.trim(),
        description: encodedDescription,
        base_price: Number(input.base_price),
        is_active: input.is_active ?? true,
      };
      insertResult = await supabase
        .from("products")
        .insert(fallbackPayload)
        .select("id")
        .single();
    }

    if (insertResult.error || !insertResult.data) {
      return { success: false, error: insertResult.error?.message || "Failed to create product." };
    }

    const productId = insertResult.data.id;

    // Insert variants if provided
    if (input.variants && input.variants.length > 0) {
      const variantsPayload: VariantInsert[] = input.variants.map((v) => ({
        product_id: productId,
        name: v.name.trim(),
        price_adjustment: Number(v.price_adjustment) || 0,
        sku: v.sku?.trim() || null,
      }));

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantsPayload);

      if (variantError) {
        if (variantError.code === "23505" || variantError.message.includes("product_variants_sku_key")) {
          return {
            success: false,
            error: `Product created, but a variant SKU is already in use by another variant. Please ensure variant SKUs are unique, or leave them empty.`,
          };
        }
        return {
          success: false,
          error: `Product created, but variants failed: ${variantError.message}`,
        };
      }
    }

    safeRevalidate("/products");
    return {
      success: true,
      message: "Product created successfully.",
      data: { id: productId },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Updates product details including type, sales price, and cost price.
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ActionResponse> {
  try {
    const supabase = await getDbClient();

    // Check negative numbers
    if (input.base_price !== undefined && Number(input.base_price) < 0) {
      return { success: false, error: "Validation error: Base sales price cannot be negative." };
    }
    if (input.cost_price !== undefined && Number(input.cost_price) < 0) {
      return { success: false, error: "Validation error: Cost price cannot be negative." };
    }

    // Fetch existing product to preserve fields
    const { data: existing } = await supabase
      .from("products")
      .select("id, name, description, base_price, is_active")
      .eq("id", id)
      .single();

    const parsedExisting = existing ? parseProduct(existing) : null;
    const finalType: ProductType = input.type || parsedExisting?.type || "service";
    const finalCostPrice = input.cost_price !== undefined ? Number(input.cost_price) : (parsedExisting?.costPrice || 0);
    const finalDesc = input.description !== undefined ? input.description : (parsedExisting?.description || "");
    const encodedDescription = encodeProductDescription(finalDesc, finalType, finalCostPrice);

    const updatePayload: ProductUpdate = {
      updated_at: new Date().toISOString(),
      type: finalType,
      cost_price: finalCostPrice,
      description: encodedDescription,
    };

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.base_price !== undefined) updatePayload.base_price = Number(input.base_price);
    if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

    let updateRes = await supabase.from("products").update(updatePayload).eq("id", id);
    if (updateRes.error) {
      // Fallback without new columns if needed
      delete updatePayload.type;
      delete updatePayload.cost_price;
      updateRes = await supabase.from("products").update(updatePayload).eq("id", id);
    }

    if (updateRes.error) {
      return { success: false, error: updateRes.error.message };
    }

    safeRevalidate("/products");
    safeRevalidate(`/products/${id}`);
    return { success: true, message: "Product updated successfully." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Deletes or deactivates a product according to business rules.
 * If the product is associated with subscriptions, it deactivates instead of breaking relationships.
 */
export async function deleteProduct(id: string): Promise<ActionResponse<{ action: "deleted" | "deactivated" }>> {
  try {
    const supabase = await getDbClient();

    // Check if plans associated with this product have active or draft subscriptions
    const { data: plans } = await supabase
      .from("plans")
      .select("id")
      .eq("product_id", id);

    const planIds = (plans || []).map((p) => p.id);

    let hasSubscriptions = false;
    if (planIds.length > 0) {
      const { count } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .in("plan_id", planIds);
      hasSubscriptions = (count || 0) > 0;
    }

    if (hasSubscriptions) {
      // Deactivate according to system rules
      await supabase
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      safeRevalidate("/products");
      safeRevalidate(`/products/${id}`);
      return {
        success: true,
        message: "Product has associated subscriptions; it was safely deactivated from catalog instead of deleted.",
        data: { action: "deactivated" },
      };
    }

    // No subscriptions: hard delete variants, plans, and product
    await supabase.from("product_variants").delete().eq("product_id", id);
    await supabase.from("plans").delete().eq("product_id", id);
    const { error: deleteErr } = await supabase.from("products").delete().eq("id", id);

    if (deleteErr) {
      return { success: false, error: deleteErr.message };
    }

    safeRevalidate("/products");
    return {
      success: true,
      message: "Product removed successfully.",
      data: { action: "deleted" },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Creates a variant for a product.
 */
export async function createVariant(
  input: CreateVariantInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await getDbClient();

    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Validation error: Variant name is required." };
    }

    const sku = input.sku?.trim() || null;
    const variantPayload: VariantInsert = {
      product_id: input.product_id,
      name: input.name.trim(),
      price_adjustment: Number(input.price_adjustment) || 0,
      sku: sku,
    };

    const { data, error } = await supabase
      .from("product_variants")
      .insert(variantPayload)
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "23505" || error?.message?.includes("product_variants_sku_key")) {
        return {
          success: false,
          error: `Validation error: SKU '${sku}' is already in use by another variant. SKUs must be unique, or you can leave it blank.`,
        };
      }
      return { success: false, error: error?.message || "Failed to create variant." };
    }

    safeRevalidate(`/products/${input.product_id}`);
    return { success: true, message: "Variant created.", data: { id: data.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Deletes a product variant.
 */
export async function deleteVariant(
  variantId: string,
  productId: string
): Promise<ActionResponse> {
  try {
    const supabase = await getDbClient();

    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId);

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidate(`/products/${productId}`);
    return { success: true, message: "Variant deleted successfully." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Creates a plan with complete configuration:
 * billing cycle (daily, weekly, monthly, yearly), minimum quantity,
 * availability dates, and permission flags.
 */
export async function createPlan(
  input: CreatePlanInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await getDbClient();

    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Validation error: Plan name is required." };
    }
    const validFrequencies: BillingFrequency[] = ["daily", "weekly", "monthly", "yearly"];
    if (!validFrequencies.includes(input.billing_frequency)) {
      return {
        success: false,
        error: "Billing frequency must be 'daily', 'weekly', 'monthly', or 'yearly'.",
      };
    }

    const minQty = Math.max(1, input.minimum_quantity ?? 1);
    const encodedName = encodePlanName(input.name, {
      billingFrequency: input.billing_frequency,
      minimumQuantity: minQty,
      availabilityStart: input.availability_start,
      availabilityEnd: input.availability_end,
      autoCloseAfterExpiry: input.auto_close_after_expiry,
      allowEarlyClosure: input.allow_early_closure,
      allowPausing: input.allow_pausing,
      allowRenewal: input.allow_renewal,
    });

    // Store compatible frequency if DB constraint is currently monthly/yearly
    const dbFrequency = ["monthly", "yearly"].includes(input.billing_frequency)
      ? input.billing_frequency
      : "monthly";

    const planPayload: PlanInsert = {
      product_id: input.product_id,
      name: encodedName,
      billing_frequency: input.billing_frequency,
      interval_count: Math.max(1, input.interval_count ?? 1),
      minimum_quantity: minQty,
      availability_start: input.availability_start || null,
      availability_end: input.availability_end || null,
      auto_close_after_expiry: input.auto_close_after_expiry ?? false,
      allow_early_closure: input.allow_early_closure ?? true,
      allow_pausing: input.allow_pausing ?? true,
      allow_renewal: input.allow_renewal ?? true,
      is_active: input.is_active ?? true,
    };

    let insertRes = await supabase
      .from("plans")
      .insert(planPayload)
      .select("id")
      .single();

    if (insertRes.error) {
      // Fallback with encoded name and compatible frequency
      const fallbackPayload: PlanInsert = {
        product_id: input.product_id,
        name: encodedName,
        billing_frequency: dbFrequency as "monthly" | "yearly",
        interval_count: Math.max(1, input.interval_count ?? 1),
        is_active: input.is_active ?? true,
      };
      insertRes = await supabase
        .from("plans")
        .insert(fallbackPayload)
        .select("id")
        .single();
    }

    if (insertRes.error || !insertRes.data) {
      return { success: false, error: insertRes.error?.message || "Failed to create plan." };
    }

    safeRevalidate("/plans");
    safeRevalidate(`/products/${input.product_id}`);
    return { success: true, message: "Plan created successfully.", data: { id: insertRes.data.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Updates an existing plan's configuration and permissions.
 */
export async function updatePlan(
  id: string,
  input: UpdatePlanInput
): Promise<ActionResponse> {
  try {
    const supabase = await getDbClient();

    // Fetch existing plan to merge configuration
    const { data: existing, error: fetchErr } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: "Plan not found." };
    }

    const currentConfig = parsePlan(existing);
    const finalCleanName = input.name !== undefined ? input.name.trim() : currentConfig.cleanName;
    const finalFreq = input.billing_frequency || currentConfig.billingFrequency;
    const finalMinQty = input.minimum_quantity !== undefined ? Math.max(1, input.minimum_quantity) : currentConfig.minimumQuantity;
    const finalStart = input.availability_start !== undefined ? input.availability_start : currentConfig.availabilityStart;
    const finalEnd = input.availability_end !== undefined ? input.availability_end : currentConfig.availabilityEnd;
    const finalAutoClose = input.auto_close_after_expiry !== undefined ? input.auto_close_after_expiry : currentConfig.autoCloseAfterExpiry;
    const finalEarlyClose = input.allow_early_closure !== undefined ? input.allow_early_closure : currentConfig.allowEarlyClosure;
    const finalPausing = input.allow_pausing !== undefined ? input.allow_pausing : currentConfig.allowPausing;
    const finalRenewal = input.allow_renewal !== undefined ? input.allow_renewal : currentConfig.allowRenewal;
    const finalInterval = input.interval_count !== undefined ? Math.max(1, input.interval_count) : currentConfig.intervalCount;
    const finalActive = input.is_active !== undefined ? input.is_active : currentConfig.isActive;

    const encodedName = encodePlanName(finalCleanName, {
      billingFrequency: finalFreq,
      minimumQuantity: finalMinQty,
      availabilityStart: finalStart,
      availabilityEnd: finalEnd,
      autoCloseAfterExpiry: finalAutoClose,
      allowEarlyClosure: finalEarlyClose,
      allowPausing: finalPausing,
      allowRenewal: finalRenewal,
    });

    const updatePayload: PlanUpdate = {
      updated_at: new Date().toISOString(),
      name: encodedName,
      billing_frequency: finalFreq,
      interval_count: finalInterval,
      minimum_quantity: finalMinQty,
      availability_start: finalStart || null,
      availability_end: finalEnd || null,
      auto_close_after_expiry: finalAutoClose,
      allow_early_closure: finalEarlyClose,
      allow_pausing: finalPausing,
      allow_renewal: finalRenewal,
      is_active: finalActive,
    };

    let updateRes = await supabase.from("plans").update(updatePayload).eq("id", id);
    if (updateRes.error) {
      // Fallback
      delete updatePayload.minimum_quantity;
      delete updatePayload.availability_start;
      delete updatePayload.availability_end;
      delete updatePayload.auto_close_after_expiry;
      delete updatePayload.allow_early_closure;
      delete updatePayload.allow_pausing;
      delete updatePayload.allow_renewal;
      if (!["monthly", "yearly"].includes(finalFreq)) {
        updatePayload.billing_frequency = "monthly";
      }
      updateRes = await supabase.from("plans").update(updatePayload).eq("id", id);
    }

    if (updateRes.error) {
      return { success: false, error: updateRes.error.message };
    }

    safeRevalidate("/plans");
    return { success: true, message: "Plan updated successfully." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Toggles a plan active/inactive status.
 */
export async function togglePlanStatus(
  id: string,
  is_active: boolean
): Promise<ActionResponse> {
  return updatePlan(id, { is_active });
}
