-- SubscriptIQ — Phase 5: Profiles RLS Policies
-- Allow users to view and update their own profile; allow admins and staff full access.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins and Staff have full access to profiles'
    ) THEN
        CREATE POLICY "Admins and Staff have full access to profiles" ON public.profiles
            FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));
    END IF;
END $$;
