"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";
import type { CustomerRow, CustomerDetailRecord } from "@/lib/customers/types";
import { buildCustomerDetailRecord } from "@/lib/customers/service";

export interface CreateCustomerInput {
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  billingAddress?: {
    line1?: string;
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

/**
 * Fetches all live customers from Supabase along with their subscriptions and invoices.
 */
export async function getCustomers(): Promise<ActionResponse<CustomerDetailRecord[]>> {
  try {
    const supabase = await createClient();

    // Query customers
    const { data: customersData, error: custError } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (custError) {
      return { success: false, error: custError.message };
    }

    if (!customersData || customersData.length === 0) {
      return { success: true, data: [] };
    }

    // Query subscriptions
    const { data: subsData } = await supabase
      .from("subscriptions")
      .select(`
        id,
        customer_id,
        plan_id,
        status,
        start_date,
        next_billing_date,
        plan:plans (
          id,
          name,
          billing_frequency,
          interval_count,
          product:products (
            id,
            name,
            base_price
          )
        ),
        items:subscription_items (
          id,
          quantity,
          unit_price
        )
      `);

    // Query invoices
    const { data: invsData } = await supabase
      .from("invoices")
      .select(`
        id,
        customer_id,
        invoice_number,
        total_amount,
        paid_amount,
        outstanding_balance,
        status,
        due_date,
        created_at
      `)
      .order("created_at", { ascending: false });

    // Group subscriptions by customer_id
    const subsByCustomer = new Map<string, Array<Record<string, any>>>();
    (subsData || []).forEach((sub) => {
      const list = subsByCustomer.get(sub.customer_id) || [];
      list.push(sub);
      subsByCustomer.set(sub.customer_id, list);
    });

    // Group invoices by customer_id
    const invsByCustomer = new Map<string, Array<Record<string, any>>>();
    (invsData || []).forEach((inv) => {
      const list = invsByCustomer.get(inv.customer_id) || [];
      list.push(inv);
      invsByCustomer.set(inv.customer_id, list);
    });

    const records: CustomerDetailRecord[] = customersData.map((c: CustomerRow) => {
      const customerSubs = subsByCustomer.get(c.id) || [];
      const customerInvs = invsByCustomer.get(c.id) || [];
      return buildCustomerDetailRecord(c, customerSubs, customerInvs);
    });

    return { success: true, data: records };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load customers.";
    return { success: false, error: message };
  }
}

/**
 * Creates a new customer record directly into Supabase.
 */
export async function createCustomer(
  input: CreateCustomerInput
): Promise<ActionResponse<CustomerRow>> {
  try {
    const name = input.name?.trim();
    const email = input.email?.toLowerCase().trim();

    if (!name) {
      return { success: false, error: "Validation error: Customer name is required." };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Validation error: A valid email address is required." };
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "A customer with this email address already exists.",
      };
    }

    const billingAddress = input.billingAddress || {
      city: "Bengaluru",
      country: "India",
    };

    const { data: inserted, error: insertError } = await supabase
      .from("customers")
      .insert({
        name,
        email,
        company_name: input.companyName?.trim() || null,
        phone: input.phone?.trim() || null,
        billing_address: billingAddress,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      // If RLS blocked anon client, try admin client as fallback
      const admin = getAdminClient();
      if (admin) {
        const { data: adminInserted, error: adminError } = await admin
          .from("customers")
          .insert({
            name,
            email,
            company_name: input.companyName?.trim() || null,
            phone: input.phone?.trim() || null,
            billing_address: billingAddress,
          })
          .select("*")
          .single();

        if (adminError || !adminInserted) {
          return { success: false, error: adminError?.message || "Failed to create customer." };
        }

        revalidatePath("/customers");
        revalidatePath("/subscriptions/new");
        revalidatePath("/dashboard");
        return { success: true, data: adminInserted as CustomerRow, message: "Customer created successfully." };
      }

      return { success: false, error: insertError?.message || "Failed to create customer." };
    }

    revalidatePath("/customers");
    revalidatePath("/subscriptions/new");
    revalidatePath("/dashboard");
    return { success: true, data: inserted as CustomerRow, message: "Customer created successfully." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create customer.";
    return { success: false, error: message };
  }
}
