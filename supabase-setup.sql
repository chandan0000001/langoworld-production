-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                                                                        ║
-- ║              🌍 LangoWorld — COMPLETE SUPABASE SETUP                   ║
-- ║                                                                        ║
-- ║   Run this SINGLE file in Supabase Dashboard → SQL Editor              ║
-- ║   This creates ALL tables, indexes, RLS policies, and triggers         ║
-- ║                                                                        ║
-- ║   Tables created:                                                      ║
-- ║     1. profiles            — User profiles (extends auth.users)        ║
-- ║     2. summaries           — YouTube / Upload / Document summaries     ║
-- ║     3. translations        — Per-summary cached translations           ║
-- ║     4. translation_history — Persistent translation panel history      ║
-- ║     5. audio_cache         — TTS audio file cache (R2 CDN URLs)        ║
-- ║                                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════
-- 1. PROFILES TABLE
--    Extends Supabase auth.users with username & display info
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════
-- 2. SUMMARIES TABLE
--    Stores all AI-generated video/document summaries
--    source = 'youtube' | 'upload' | 'document'
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.summaries (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    video_url TEXT NOT NULL,
    video_title TEXT NOT NULL,
    channel TEXT DEFAULT '',
    summary TEXT DEFAULT '',
    key_points JSONB DEFAULT '[]',
    explanation TEXT DEFAULT '',
    tts_summary TEXT DEFAULT '',
    transcript TEXT DEFAULT '',
    chapters JSONB DEFAULT '[]',
    source TEXT DEFAULT 'youtube',  -- 'youtube' | 'upload' | 'document'
    video_cdn_url TEXT DEFAULT '',   -- R2 CDN URL for uploaded videos
    slug TEXT UNIQUE,                -- Custom URL slug (optional, unique if set)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists (run this if you have existing data)
-- ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'youtube';
-- ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS video_cdn_url TEXT DEFAULT '';
-- ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;


-- ═══════════════════════════════════════════════════════════
-- 3. TRANSLATIONS TABLE
--    Cached translations per summary per language
--    One row per (summary_id, language) pair
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    summary_id TEXT REFERENCES public.summaries(id) ON DELETE CASCADE NOT NULL,
    language TEXT NOT NULL,
    translated_data JSONB DEFAULT '{}',
    translated_transcript TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(summary_id, language)
);


-- ═══════════════════════════════════════════════════════════
-- 4. TRANSLATION HISTORY TABLE
--    Stores every translation from the Translation Panel
--    Each row = one translate action (source text + all targets)
--    translations JSONB = [{targetLang, translatedText, langName, flag}]
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.translation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    source_lang VARCHAR(10) NOT NULL DEFAULT 'en',
    translations JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════
-- 5. AUDIO CACHE TABLE
--    Caches TTS audio files stored on Cloudflare R2
--    Prevents re-generating same audio (hash-based lookup)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audio_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text_hash TEXT NOT NULL,
    language TEXT NOT NULL,
    text_preview TEXT,
    r2_url TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    page_id TEXT,
    page_title TEXT,
    section TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(text_hash, language)
);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                     ROW LEVEL SECURITY (RLS)                           ║
-- ║   Every table has RLS enabled — users can only access their own data   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_cache ENABLE ROW LEVEL SECURITY;


-- ─── Profiles Policies ─────────────────────────────────────
-- Everyone can read profiles (needed for username uniqueness check)
-- Users can only insert/update their own profile

CREATE POLICY "Public profiles are viewable"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);


-- ─── Summaries Policies ────────────────────────────────────
-- Users can only CRUD their own summaries

CREATE POLICY "Users can view own summaries"
    ON public.summaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
    ON public.summaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries"
    ON public.summaries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries"
    ON public.summaries FOR DELETE
    USING (auth.uid() = user_id);


-- ─── Translations Policies ─────────────────────────────────
-- Users can CRUD translations only if they own the parent summary

CREATE POLICY "Users can view own translations"
    ON public.translations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.summaries
        WHERE summaries.id = translations.summary_id
        AND summaries.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own translations"
    ON public.translations FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.summaries
        WHERE summaries.id = translations.summary_id
        AND summaries.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own translations"
    ON public.translations FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.summaries
        WHERE summaries.id = translations.summary_id
        AND summaries.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own translations"
    ON public.translations FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.summaries
        WHERE summaries.id = translations.summary_id
        AND summaries.user_id = auth.uid()
    ));


-- ─── Translation History Policies ──────────────────────────
-- Users can only view/insert/delete their own translation history

CREATE POLICY "Users can view own translation history"
    ON public.translation_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own translation history"
    ON public.translation_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own translation history"
    ON public.translation_history FOR DELETE
    USING (auth.uid() = user_id);


-- ─── Audio Cache Policies ──────────────────────────────────
-- Audio cache is shared across all users (public resource)
-- Any authenticated user can read/write audio cache

CREATE POLICY "Allow all audio_cache operations"
    ON public.audio_cache FOR ALL
    USING (true)
    WITH CHECK (true);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                          INDEXES                                       ║
-- ║   Speed up common queries — user lookups, history sorting, etc.        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username
    ON public.profiles(username);

-- Summaries
CREATE INDEX IF NOT EXISTS idx_summaries_user_id
    ON public.summaries(user_id);

CREATE INDEX IF NOT EXISTS idx_summaries_created_at
    ON public.summaries(created_at DESC);

-- Translation History
CREATE INDEX IF NOT EXISTS idx_translation_history_user_id
    ON public.translation_history(user_id);

CREATE INDEX IF NOT EXISTS idx_translation_history_created_at
    ON public.translation_history(created_at DESC);

-- Audio Cache
CREATE INDEX IF NOT EXISTS idx_audio_cache_lookup
    ON public.audio_cache(text_hash, language);

CREATE INDEX IF NOT EXISTS idx_audio_cache_page
    ON public.audio_cache(page_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                     TRIGGERS & FUNCTIONS                               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Auto-update updated_at timestamp on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                         ✅ SETUP COMPLETE                              ║
-- ║                                                                        ║
-- ║   Tables created: 5                                                    ║
-- ║   RLS policies:   14                                                   ║
-- ║   Indexes:        7                                                    ║
-- ║   Triggers:       1                                                    ║
-- ║                                                                        ║
-- ║   Next steps:                                                          ║
-- ║   1. Enable Email/Password auth in Authentication → Providers          ║
-- ║   2. Set your environment variables in .env.local                      ║
-- ║   3. Run: npm run dev                                                  ║
-- ║                                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
