-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                                                                          ║
-- ║              🗑️ SOFT DELETE — ACCOUNT DELETION SUPPORT                   ║
-- ║                                                                          ║
-- ║   Run this in Supabase Dashboard → SQL Editor                            ║
-- ║                                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════
-- 1. ADD SOFT DELETE COLUMN TO PROFILES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient deleted user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at 
ON public.profiles(deleted_at) 
WHERE deleted_at IS NOT NULL;


-- ═══════════════════════════════════════════════════════════
-- 2. HELPER FUNCTION: CHECK IF USER IS SOFT DELETED
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_user_deleted(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND deleted_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════
-- 3. UPDATE RLS POLICY FOR SELF-UPDATE
--    Users can update their own profile (for soft delete)
-- ═══════════════════════════════════════════════════════════

-- The existing policy should already allow this:
-- CREATE POLICY "Users can update own profile"
--     ON public.profiles FOR UPDATE
--     USING (auth.uid() = id);

-- But let's ensure it exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
            ON public.profiles FOR UPDATE
            USING (auth.uid() = id);
    END IF;
END $$;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                         ✅ SOFT DELETE SETUP COMPLETE                    ║
-- ║                                                                          ║
-- ║   Changes made:                                                          ║
-- ║   ✓ Added 'deleted_at' column to profiles (default: NULL)               ║
-- ║   ✓ Created index for deleted user lookups                              ║
-- ║   ✓ Created is_user_deleted() helper function                           ║
-- ║   ✓ Ensured update RLS policy exists                                    ║
-- ║                                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
