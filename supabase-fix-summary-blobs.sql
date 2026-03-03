-- ═══════════════════════════════════════════════════════════════════════════════
-- ONE-TIME MIGRATION: Fix JSON blobs in summary column
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Problem: Some rows have summary stored as JSON objects like:
--   {"summary": "...", "keyPoints": [...]}
-- Instead of plain strings.
--
-- This script safely extracts the actual summary text from JSON blobs.
-- Uses exception handling to skip invalid JSON rows (prevents ERROR 22P02).
-- Run this once via Supabase SQL Editor after deploying the code fix.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Create safe JSON extraction function (handles invalid JSON gracefully)
CREATE OR REPLACE FUNCTION pg_temp.safe_jsonb_extract(text_val text, key_name text)
RETURNS text AS $$
BEGIN
    IF text_val IS NULL OR text_val = '' THEN
        RETURN NULL;
    END IF;
    -- Attempt to parse as JSONB and extract key
    RETURN (text_val::jsonb)->>key_name;
EXCEPTION WHEN OTHERS THEN
    -- Invalid JSON or key not found - return NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 2: Preview affected rows (run this first to see what will be changed)
-- SELECT 
--     id,
--     video_title,
--     source,
--     LEFT(summary, 100) as summary_preview,
--     pg_temp.safe_jsonb_extract(summary, 'summary') as extracted_summary,
--     created_at
-- FROM summaries
-- WHERE summary LIKE '{%'
--   AND pg_temp.safe_jsonb_extract(summary, 'summary') IS NOT NULL;

-- Step 3: Fix summary column (only rows with valid JSON containing 'summary' key)
UPDATE summaries
SET summary = pg_temp.safe_jsonb_extract(summary, 'summary')
WHERE summary LIKE '{%'
  AND pg_temp.safe_jsonb_extract(summary, 'summary') IS NOT NULL;

-- Step 4: Fix explanation column (try multiple possible keys)
UPDATE summaries
SET explanation = COALESCE(
    pg_temp.safe_jsonb_extract(explanation, 'explanation'),
    pg_temp.safe_jsonb_extract(explanation, 'content'),
    pg_temp.safe_jsonb_extract(explanation, 'text')
)
WHERE explanation LIKE '{%'
  AND (
    pg_temp.safe_jsonb_extract(explanation, 'explanation') IS NOT NULL
    OR pg_temp.safe_jsonb_extract(explanation, 'content') IS NOT NULL
    OR pg_temp.safe_jsonb_extract(explanation, 'text') IS NOT NULL
  );

-- Step 5: Verify no more JSON blobs remain
-- SELECT COUNT(*) as remaining_blobs
-- FROM summaries
-- WHERE summary LIKE '{%';

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTES:
-- - pg_temp.safe_jsonb_extract() catches invalid JSON and returns NULL
-- - This only fixes "summary" and "explanation" text columns
-- - key_points column is NOT modified (intentionally JSONB array)
-- - The temp function is automatically dropped when the session ends
-- ═══════════════════════════════════════════════════════════════════════════════
