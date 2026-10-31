-- SubscriptIQ — Phase 2: Auth Profiles Sync Trigger & Backfill

-- 1. Create a function to automatically sync new auth users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'customer';
  v_customer_id UUID := NULL;
  v_name TEXT;
BEGIN
  -- Determine role: check user metadata first, then fall back to email domain conventions
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := NEW.raw_user_meta_data->>'role';
  ELSIF NEW.email ILIKE 'admin@%' THEN
    v_role := 'admin';
  ELSIF NEW.email ILIKE 'staff@%' THEN
    v_role := 'staff';
  ELSE
    v_role := 'customer';
  END IF;

  -- Extract display name
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', initcap(split_part(NEW.email, '@', 1)));

  -- For customer accounts, link to Acme Corporation by default
  IF v_role = 'customer' THEN
    SELECT id INTO v_customer_id FROM public.customers WHERE email = 'billing@acme.com' LIMIT 1;
    IF v_customer_id IS NULL THEN
      SELECT id INTO v_customer_id FROM public.customers LIMIT 1;
    END IF;
  END IF;

  -- Insert or update public.profiles
  INSERT INTO public.profiles (id, email, full_name, role, customer_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_role,
    v_customer_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    role = EXCLUDED.role,
    customer_id = COALESCE(public.profiles.customer_id, EXCLUDED.customer_id),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill any existing users in auth.users that were already created
INSERT INTO public.profiles (id, email, full_name, role, customer_id, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', initcap(split_part(u.email, '@', 1))),
  CASE 
    WHEN u.raw_user_meta_data->>'role' IS NOT NULL THEN u.raw_user_meta_data->>'role'
    WHEN u.email ILIKE 'admin@%' THEN 'admin'
    WHEN u.email ILIKE 'staff@%' THEN 'staff'
    ELSE 'customer'
  END,
  CASE 
    WHEN u.email ILIKE 'admin@%' OR u.email ILIKE 'staff@%' THEN NULL
    ELSE (SELECT id FROM public.customers WHERE email = 'billing@acme.com' LIMIT 1)
  END,
  now(),
  now()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  customer_id = COALESCE(public.profiles.customer_id, EXCLUDED.customer_id),
  updated_at = now();
