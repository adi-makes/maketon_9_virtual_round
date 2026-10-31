-- SubscriptIQ — Subscription Management System
-- Safe Starter Demonstration Data (Consistent with initial schema)

-- 1. Standard Tax Rules
INSERT INTO public.tax_rules (id, name, rate_percent, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'GST Standard 18%', 18.00, true),
  ('11111111-1111-1111-1111-111111111112', 'Zero Rated 0%', 0.00, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Demo Products
INSERT INTO public.products (id, name, description, base_price, is_active)
VALUES
  ('22222222-2222-2222-2222-222222222221', 'SubscriptIQ Cloud Suite', 'Enterprise cloud subscription management platform', 1000.00, true),
  ('22222222-2222-2222-2222-222222222222', 'Analytics Pro Addon', 'Advanced revenue recovery and recurring metrics dashboard', 500.00, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Product Variants
INSERT INTO public.product_variants (id, product_id, name, price_adjustment, sku)
VALUES
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 'Standard (Up to 5 Users)', 0.00, 'BL-STD-5'),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222221', 'Enterprise (Unlimited Users)', 1500.00, 'BL-ENT-UNL')
ON CONFLICT (id) DO NOTHING;

-- 4. Subscription Plans
INSERT INTO public.plans (id, product_id, name, billing_frequency, interval_count, is_active)
VALUES
  ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222221', 'Monthly Standard Plan', 'monthly', 1, true),
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222221', 'Annual Standard Plan (10% Discount)', 'yearly', 1, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Demo Customer Organizations
INSERT INTO public.customers (id, name, email, company_name, billing_address, phone)
VALUES
  ('55555555-5555-5555-5555-555555555551', 'Acme Corporation', 'billing@acme.com', 'Acme Corp Technologies', '{"street": "100 Tech Blvd", "city": "Bangalore", "country": "India"}'::jsonb, '+91-9876543210'),
  ('55555555-5555-5555-5555-555555555552', 'Globex Industries', 'accounts@globex.com', 'Globex International', '{"street": "45 Industrial Park", "city": "Mumbai", "country": "India"}'::jsonb, '+91-9876543211')
ON CONFLICT (id) DO NOTHING;

-- 6. Demo Promotional Discounts
INSERT INTO public.discounts (id, code, description, discount_percent, is_active)
VALUES
  ('66666666-6666-6666-6666-666666666661', 'HACKATHON10', '10% promotional discount for hackathon evaluation', 10.00, true)
ON CONFLICT (id) DO NOTHING;
