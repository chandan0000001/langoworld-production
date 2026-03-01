# Admin Panel Setup Guide

## 1. Database Schema Updates

Run these SQL commands in Supabase Dashboard → SQL Editor:

```sql
-- ═══════════════════════════════════════════════════════════
-- ADMIN PANEL SCHEMA UPDATES
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'admin'));

-- 2. Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ═══════════════════════════════════════════════════════════
-- ADMIN RLS POLICIES
-- These allow admins to access all data
-- ═══════════════════════════════════════════════════════════

-- Helper function to check if current user is admin
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

-- ─── Admin Summaries Policies ──────────────────────────────
-- Admins can view ALL summaries (not just their own)
CREATE POLICY "Admins can view all summaries"
    ON public.summaries FOR SELECT
    USING (public.is_admin());

-- Admins can delete ANY summary
CREATE POLICY "Admins can delete any summary"
    ON public.summaries FOR DELETE
    USING (public.is_admin());

-- Admins can update ANY summary (for re-processing)
CREATE POLICY "Admins can update any summary"
    ON public.summaries FOR UPDATE
    USING (public.is_admin());

-- ─── Admin Profiles Policies ───────────────────────────────
-- Admins can view all profiles with full details
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

-- ─── Admin Translations Policies ───────────────────────────
-- Admins can view all translations
CREATE POLICY "Admins can view all translations"
    ON public.translations FOR SELECT
    USING (public.is_admin());

-- Admins can delete any translation
CREATE POLICY "Admins can delete any translation"
    ON public.translations FOR DELETE
    USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- GRANT ADMIN ROLE TO A USER
-- Replace 'user-email@example.com' with actual email
-- ═══════════════════════════════════════════════════════════

-- Option 1: Grant admin by email (run after user signs up)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (
--     SELECT id FROM auth.users 
--     WHERE email = 'user-email@example.com'
-- );

-- Option 2: Grant admin by user_id directly
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = 'uuid-of-user';
```

## 2. Folder Structure

```
app/admin/
├── ADMIN_SETUP.md          # This file
├── layout.tsx              # Server-side auth wrapper
├── page.tsx                # Dashboard with stats
├── videos/
│   └── page.tsx            # Video management
├── documents/
│   └── page.tsx            # Document management
├── components/
│   ├── admin-nav.tsx       # Admin navigation
│   ├── stats-card.tsx      # Stats display component
│   ├── content-table.tsx   # Reusable content table
│   └── action-buttons.tsx  # Action buttons (delete, reprocess)
└── lib/
    ├── admin-auth.ts       # Admin authentication helpers
    └── admin-actions.ts    # Server actions for admin ops
```

## 3. Security Implementation

### Role Checking Flow:
1. **Middleware** (`middleware.ts`): Refreshes session, but does NOT check admin role
2. **Layout** (`/admin/layout.tsx`): Server component that:
   - Gets user session via `createClient()`
   - Queries `profiles` table for role
   - Redirects non-admins to homepage
3. **Server Actions** (`admin-actions.ts`): 
   - Each action re-validates admin role
   - Uses RLS policies (anon key, not service_role)
   - Double-checks before destructive operations

### Why NOT use service_role key:
- Service role bypasses RLS completely
- If exposed, it gives full database access
- Instead, we use RLS policies that grant admin access
- All queries go through RLS, even for admins

## 4. Making Yourself an Admin

1. Sign up / login to create your profile
2. Go to Supabase Dashboard → SQL Editor
3. Run:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = 'YOUR_EMAIL@example.com'
);
```

## 5. Environment Variables

No new environment variables needed! Admin panel uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The service_role key is NOT used to prevent accidental exposure.

## 6. Testing Admin Access

1. Set yourself as admin (step 4 above)
2. Navigate to `/admin`
3. You should see the dashboard
4. Test with a non-admin user - should redirect to `/`
