import { createHash } from "crypto"

/**
 * Content Hashing Utility
 * Generates SHA256 hashes for cache deduplication
 */

/**
 * Generate SHA256 hash from a Buffer (for file uploads)
 */
export function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex")
}

/**
 * Generate SHA256 hash from a string (for text content)
 */
export function hashString(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

/**
 * Generate SHA256 hash from translation input
 * Combines source text and source language for unique key
 */
export function hashTranslationInput(sourceText: string, sourceLang: string): string {
  const input = `${sourceLang}:${sourceText}`
  return createHash("sha256").update(input, "utf8").digest("hex")
}

/**
 * Generate SHA256 hash for video content
 * Uses first/last chunks + size for efficiency on large files
 */
export function hashVideoContent(buffer: Buffer): string {
  const CHUNK_SIZE = 64 * 1024 // 64KB chunks
  
  // For small files, hash entire content
  if (buffer.length <= CHUNK_SIZE * 2) {
    return hashBuffer(buffer)
  }
  
  // For large files, hash first chunk + last chunk + file size
  const firstChunk = buffer.subarray(0, CHUNK_SIZE)
  const lastChunk = buffer.subarray(-CHUNK_SIZE)
  const sizeStr = buffer.length.toString()
  
  const combined = Buffer.concat([
    firstChunk,
    lastChunk,
    Buffer.from(sizeStr),
  ])
  
  return hashBuffer(combined)
}

/**
 * Generate SHA256 hash for document content
 * Full content hash for documents (typically smaller than videos)
 */
export function hashDocumentContent(buffer: Buffer): string {
  return hashBuffer(buffer)
}

/**
 * Validate hash format (64 char hex string)
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash)
}
