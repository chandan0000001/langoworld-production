-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                                                                          ║
-- ║              🔐 CONTENT HASHING — CACHE DEDUPLICATION                    ║
-- ║                                                                          ║
-- ║   Run this in Supabase Dashboard → SQL Editor                            ║
-- ║   Adds hash columns for cache deduplication                              ║
-- ║                                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════
-- 1. ADD CONTENT HASH TO SUMMARIES TABLE
--    For video/document upload deduplication
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.summaries 
ADD COLUMN IF NOT EXISTS content_hash TEXT DEFAULT NULL;

-- Unique index for hash lookups (partial - only non-null hashes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_summaries_content_hash 
ON public.summaries(content_hash) 
WHERE content_hash IS NOT NULL;

-- Index for fast hash lookups
CREATE INDEX IF NOT EXISTS idx_summaries_hash_lookup 
ON public.summaries(content_hash, user_id) 
WHERE content_hash IS NOT NULL;


-- ═══════════════════════════════════════════════════════════
-- 2. ADD INPUT HASH TO TRANSLATIONS TABLE
--    For translation input deduplication
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.translations 
ADD COLUMN IF NOT EXISTS input_hash TEXT DEFAULT NULL;

-- Index for fast input hash lookups
CREATE INDEX IF NOT EXISTS idx_translations_input_hash 
ON public.translations(input_hash, language) 
WHERE input_hash IS NOT NULL;


-- ═══════════════════════════════════════════════════════════
-- 3. ADD INPUT HASH TO TRANSLATION HISTORY TABLE
--    For translation panel deduplication
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.translation_history 
ADD COLUMN IF NOT EXISTS input_hash TEXT DEFAULT NULL;

-- Index for fast input hash lookups per user
CREATE INDEX IF NOT EXISTS idx_translation_history_input_hash 
ON public.translation_history(input_hash, user_id, source_lang) 
WHERE input_hash IS NOT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                         ✅ HASH COLUMNS ADDED                            ║
-- ║                                                                          ║
-- ║   Changes made:                                                          ║
-- ║   ✓ Added content_hash to summaries (for video/document dedup)          ║
-- ║   ✓ Added input_hash to translations (for translation dedup)            ║
-- ║   ✓ Added input_hash to translation_history (for panel dedup)           ║
-- ║   ✓ Created unique/lookup indexes for efficient cache checks            ║
-- ║                                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
