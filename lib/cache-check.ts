import { createClient } from "@/lib/supabase-server"
import { hashVideoContent, hashDocumentContent, hashTranslationInput } from "./content-hash"

/**
 * Cache Check Utilities
 * Check for cached results before processing
 */

export interface CachedSummary {
  id: string
  video_title: string
  summary: string
  key_points: any[]
  explanation: string
  chapters: any[]
  source: string
}

/**
 * Check if a video with this content hash already exists
 * Returns the cached summary if found, null otherwise
 */
export async function checkVideoCache(
  buffer: Buffer,
  userId: string
): Promise<CachedSummary | null> {
  const contentHash = hashVideoContent(buffer)
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("summaries")
    .select("id, video_title, summary, key_points, explanation, chapters, source")
    .eq("content_hash", contentHash)
    .eq("user_id", userId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as CachedSummary
}

/**
 * Check if a document with this content hash already exists
 * Returns the cached summary if found, null otherwise
 */
export async function checkDocumentCache(
  buffer: Buffer,
  userId: string
): Promise<CachedSummary | null> {
  const contentHash = hashDocumentContent(buffer)
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("summaries")
    .select("id, video_title, summary, key_points, explanation, chapters, source")
    .eq("content_hash", contentHash)
    .eq("user_id", userId)
    .eq("source", "document")
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as CachedSummary
}

export interface CachedTranslation {
  id: string
  translated_data: any
  translated_transcript: string
}

/**
 * Check if a translation with this input hash already exists
 * Returns the cached translation if found, null otherwise
 */
export async function checkTranslationCache(
  summaryId: string,
  sourceText: string,
  sourceLang: string,
  targetLang: string
): Promise<CachedTranslation | null> {
  const inputHash = hashTranslationInput(sourceText, sourceLang)
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("translations")
    .select("id, translated_data, translated_transcript")
    .eq("summary_id", summaryId)
    .eq("language", targetLang)
    .eq("input_hash", inputHash)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as CachedTranslation
}

/**
 * Store content hash when saving a new summary
 */
export async function storeContentHash(
  summaryId: string,
  contentHash: string
): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from("summaries")
    .update({ content_hash: contentHash })
    .eq("id", summaryId)
}

/**
 * Store input hash when saving a new translation
 */
export async function storeTranslationHash(
  translationId: string,
  inputHash: string
): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from("translations")
    .update({ input_hash: inputHash })
    .eq("id", translationId)
}
