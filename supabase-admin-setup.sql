-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                                                                          ║
-- ║              🔐 ADMIN PANEL — DATABASE SCHEMA UPDATES                    ║
-- ║                                                                          ║
-- ║   Run this AFTER the main supabase-setup.sql                             ║
-- ║   Execute in Supabase Dashboard → SQL Editor                             ║
-- ║                                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════
-- 1. ADD ROLE COLUMN TO PROFILES
--    Allows distinguishing between regular users and admins
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add constraint to ensure only valid roles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
    END IF;
END $$;

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);


-- ═══════════════════════════════════════════════════════════
-- 2. HELPER FUNCTION: IS_ADMIN
--    Returns true if the current authenticated user is an admin
--    Used in RLS policies for admin access
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════
-- 3. ADMIN RLS POLICIES FOR SUMMARIES
--    Allow admins to view, update, and delete ALL summaries
-- ═══════════════════════════════════════════════════════════

-- Drop existing admin policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can view all summaries" ON public.summaries;
DROP POLICY IF EXISTS "Admins can delete any summary" ON public.summaries;
DROP POLICY IF EXISTS "Admins can update any summary" ON public.summaries;

-- Create admin policies for summaries
CREATE POLICY "Admins can view all summaries"
    ON public.summaries FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can delete any summary"
    ON public.summaries FOR DELETE
    USING (public.is_admin());

CREATE POLICY "Admins can update any summary"
    ON public.summaries FOR UPDATE
    USING (public.is_admin());


-- ═══════════════════════════════════════════════════════════
-- 4. ADMIN RLS POLICIES FOR PROFILES
--    Allow admins to view all user profiles
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());


-- ═══════════════════════════════════════════════════════════
-- 5. ADMIN RLS POLICIES FOR TRANSLATIONS
--    Allow admins to view and delete all translations
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins can view all translations" ON public.translations;
DROP POLICY IF EXISTS "Admins can delete any translation" ON public.translations;

CREATE POLICY "Admins can view all translations"
    ON public.translations FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can delete any translation"
    ON public.translations FOR DELETE
    USING (public.is_admin());


-- ═══════════════════════════════════════════════════════════
-- 6. GRANT ADMIN ROLE
--    UNCOMMENT AND MODIFY one of these to make yourself admin
-- ═══════════════════════════════════════════════════════════

-- Option A: Grant admin by email (requires user to have signed up first)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (
--     SELECT id FROM auth.users 
--     WHERE email = 'your-email@example.com'
-- );

-- Option B: Grant admin by user UUID (get from Supabase Auth dashboard)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = '00000000-0000-0000-0000-000000000000';

-- Option C: Make the first user an admin (only for initial setup)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (
--     SELECT id FROM public.profiles 
--     ORDER BY created_at ASC 
--     LIMIT 1
-- );


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                         ✅ ADMIN SETUP COMPLETE                          ║
-- ║                                                                          ║
-- ║   Changes made:                                                          ║
-- ║   ✓ Added 'role' column to profiles (default: 'user')                   ║
-- ║   ✓ Created is_admin() helper function                                  ║
-- ║   ✓ Added 3 admin RLS policies for summaries                            ║
-- ║   ✓ Added 1 admin RLS policy for profiles                               ║
-- ║   ✓ Added 2 admin RLS policies for translations                         ║
-- ║                                                                          ║
-- ║   Next steps:                                                            ║
-- ║   1. Uncomment and modify ONE of the "Grant admin" statements above     ║
-- ║   2. Navigate to /admin to access the admin panel                       ║
-- ║                                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
