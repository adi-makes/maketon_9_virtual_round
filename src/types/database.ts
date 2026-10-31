/**
 * Database schema type definitions for SubscriptIQ.
 *
 * Generated/Mapped from Supabase PostgreSQL schema:
 * All tables: profiles, customers, products, product_variants, plans,
 * subscriptions, subscription_items, invoices, invoice_items, payments,
 * discounts, tax_rules.
 *
 * To regenerate directly from a live Supabase project:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "staff" | "customer";
          customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "staff" | "customer";
          customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "admin" | "staff" | "customer";
          customer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          company_name: string | null;
          billing_address: Json | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          company_name?: string | null;
          billing_address?: Json | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          company_name?: string | null;
          billing_address?: Json | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          base_price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          base_price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          base_price?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          price_adjustment: number;
          sku: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          price_adjustment?: number;
          sku?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          price_adjustment?: number;
          sku?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          billing_frequency: "monthly" | "yearly";
          interval_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          billing_frequency: "monthly" | "yearly";
          interval_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          billing_frequency?: "monthly" | "yearly";
          interval_count?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          customer_id: string;
          plan_id: string;
          status:
            | "draft"
            | "quotation"
            | "confirmed"
            | "active"
            | "paused"
            | "closed";
          start_date: string;
          current_period_start: string | null;
          current_period_end: string | null;
          next_billing_date: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          plan_id: string;
          status?:
            | "draft"
            | "quotation"
            | "confirmed"
            | "active"
            | "paused"
            | "closed";
          start_date?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          next_billing_date?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          plan_id?: string;
          status?:
            | "draft"
            | "quotation"
            | "confirmed"
            | "active"
            | "paused"
            | "closed";
          start_date?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          next_billing_date?: string | null;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_items: {
        Row: {
          id: string;
          subscription_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          variant_id?: string | null;
          quantity?: number;
          unit_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          variant_id?: string | null;
          quantity?: number;
          unit_price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          subscription_id: string;
          customer_id: string;
          billing_period_start: string;
          billing_period_end: string;
          due_date: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          paid_amount: number;
          outstanding_balance: number;
          status:
            "draft" | "confirmed" | "partially_paid" | "paid" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          subscription_id: string;
          customer_id: string;
          billing_period_start: string;
          billing_period_end: string;
          due_date: string;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          outstanding_balance?: number;
          status?:
            "draft" | "confirmed" | "partially_paid" | "paid" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          subscription_id?: string;
          customer_id?: string;
          billing_period_start?: string;
          billing_period_end?: string;
          due_date?: string;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          outstanding_balance?: number;
          status?:
            "draft" | "confirmed" | "partially_paid" | "paid" | "cancelled";
          updated_at?: string;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price: number;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          payment_number: string;
          invoice_id: string;
          customer_id: string;
          amount: number;
          method: "manual_entry" | "bank_transfer" | "stripe" | "razorpay";
          reference: string | null;
          status: "pending" | "completed" | "failed" | "refunded";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payment_number: string;
          invoice_id: string;
          customer_id: string;
          amount: number;
          method: "manual_entry" | "bank_transfer" | "stripe" | "razorpay";
          reference?: string | null;
          status?: "pending" | "completed" | "failed" | "refunded";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payment_number?: string;
          invoice_id?: string;
          customer_id?: string;
          amount?: number;
          method?: "manual_entry" | "bank_transfer" | "stripe" | "razorpay";
          reference?: string | null;
          status?: "pending" | "completed" | "failed" | "refunded";
          updated_at?: string;
        };
        Relationships: [];
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_percent: number | null;
          fixed_amount: number | null;
          is_active: boolean;
          valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_percent?: number | null;
          fixed_amount?: number | null;
          is_active?: boolean;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          discount_percent?: number | null;
          fixed_amount?: number | null;
          is_active?: boolean;
          valid_until?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_rules: {
        Row: {
          id: string;
          name: string;
          rate_percent: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rate_percent?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rate_percent?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_auth_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}
