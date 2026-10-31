"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResponse, BillingFrequency } from "@/types";
import type { Database } from "@/types/database";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type VariantInsert = Database["public"]["Tables"]["product_variants"]["Insert"];
type PlanInsert = Database["public"]["Tables"]["plans"]["Insert"];
type PlanUpdate = Database["public"]["Tables"]["plans"]["Update"];

export interface CreateProductInput {
  name: string;
  description?: string;
  base_price: number;
  is_active?: boolean;
  variants?: Array<{
    name: string;
    price_adjustment: number;
    sku?: string;
  }>;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  base_price?: number;
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
  is_active?: boolean;
}

export interface UpdatePlanInput {
  name?: string;
  billing_frequency?: BillingFrequency;
  interval_count?: number;
  is_active?: boolean;
}

/**
 * Creates a new product, optionally with initial variants.
 */
export async function createProduct(
  input: CreateProductInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Product name is required." };
    }
    if (input.base_price === undefined || input.base_price < 0) {
      return { success: false, error: "Base price must be a non-negative number." };
    }

    const productPayload: ProductInsert = {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      base_price: input.base_price,
      is_active: input.is_active ?? true,
    };

    const { data: product, error: prodError } = await supabase
      .from("products")
      .insert(productPayload)
      .select("id")
      .single();

    if (prodError || !product) {
      return { success: false, error: prodError?.message || "Failed to create product." };
    }

    // Insert variants if provided
    if (input.variants && input.variants.length > 0) {
      const variantsPayload: VariantInsert[] = input.variants.map((v) => ({
        product_id: product.id,
        name: v.name.trim(),
        price_adjustment: v.price_adjustment ?? 0,
        sku: v.sku?.trim() || null,
      }));

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantsPayload);

      if (variantError) {
        return {
          success: false,
          error: `Product created, but variants failed: ${variantError.message}`,
        };
      }
    }

    revalidatePath("/products");
    return {
      success: true,
      message: "Product created successfully.",
      data: { id: product.id },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Updates product details.
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const updatePayload: ProductUpdate = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
    if (input.base_price !== undefined) {
      if (input.base_price < 0) return { success: false, error: "Base price cannot be negative." };
      updatePayload.base_price = input.base_price;
    }
    if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

    const { error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return { success: true, message: "Product updated successfully." };
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
    const supabase = await createClient();

    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Variant name is required." };
    }

    const variantPayload: VariantInsert = {
      product_id: input.product_id,
      name: input.name.trim(),
      price_adjustment: input.price_adjustment ?? 0,
      sku: input.sku?.trim() || null,
    };

    const { data, error } = await supabase
      .from("product_variants")
      .insert(variantPayload)
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to create variant." };
    }

    revalidatePath(`/products/${input.product_id}`);
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
    const supabase = await createClient();

    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/products/${productId}`);
    return { success: true, message: "Variant deleted successfully." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Creates a plan associated with a product.
 */
export async function createPlan(
  input: CreatePlanInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Plan name is required." };
    }
    if (!["monthly", "yearly"].includes(input.billing_frequency)) {
      return { success: false, error: "Billing frequency must be 'monthly' or 'yearly'." };
    }

    const planPayload: PlanInsert = {
      product_id: input.product_id,
      name: input.name.trim(),
      billing_frequency: input.billing_frequency,
      interval_count: input.interval_count ?? 1,
      is_active: input.is_active ?? true,
    };

    const { data, error } = await supabase
      .from("plans")
      .insert(planPayload)
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to create plan." };
    }

    revalidatePath("/plans");
    revalidatePath(`/products/${input.product_id}`);
    return { success: true, message: "Plan created successfully.", data: { id: data.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: message };
  }
}

/**
 * Updates a plan.
 */
export async function updatePlan(
  id: string,
  input: UpdatePlanInput
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const updatePayload: PlanUpdate = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.billing_frequency !== undefined) updatePayload.billing_frequency = input.billing_frequency;
    if (input.interval_count !== undefined) updatePayload.interval_count = Math.max(1, input.interval_count);
    if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

    const { error } = await supabase
      .from("plans")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/plans");
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
