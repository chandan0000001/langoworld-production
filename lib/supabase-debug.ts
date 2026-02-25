/**
 * Supabase Debug Utilities
 * Proper error handling for PostgrestError objects
 */

import type { PostgrestError } from "@supabase/supabase-js"

export interface SupabaseDebugInfo {
  message: string
  details: string | null
  hint: string | null
  code: string
  isRLSError: boolean
  isSchemaError: boolean
  isForeignKeyError: boolean
  isAuthError: boolean
}

/**
 * Extract full error details from a Supabase PostgrestError
 * Use this instead of console.error(error) which shows {}
 */
export function debugSupabaseError(error: PostgrestError | null): SupabaseDebugInfo | null {
  if (!error) return null

  const isRLSError = 
    error.code === "42501" || 
    error.message?.toLowerCase().includes("row-level security") ||
    error.message?.toLowerCase().includes("rls") ||
    error.message?.toLowerCase().includes("policy")

  const isSchemaError = 
    error.code === "42703" || // column does not exist
    error.code === "42P01" || // relation does not exist
    error.message?.toLowerCase().includes("column") ||
    error.message?.toLowerCase().includes("does not exist")

  const isForeignKeyError = 
    error.code === "23503" || 
    error.message?.toLowerCase().includes("foreign key")

  const isAuthError = 
    error.code === "PGRST301" || 
    error.message?.toLowerCase().includes("jwt") ||
    error.message?.toLowerCase().includes("auth")

  return {
    message: error.message || "Unknown error",
    details: error.details || null,
    hint: error.hint || null,
    code: error.code || "UNKNOWN",
    isRLSError,
    isSchemaError,
    isForeignKeyError,
    isAuthError,
  }
}

/**
 * Log Supabase error with full details
 */
export function logSupabaseError(
  context: string, 
  error: PostgrestError | null,
  additionalInfo?: Record<string, any>
): void {
  if (!error) return

  const debug = debugSupabaseError(error)
  
  console.error(`[Supabase] ${context}:`, {
    ...debug,
    fullError: JSON.stringify(error, null, 2),
    ...additionalInfo,
  })

  // Log specific guidance based on error type
  if (debug?.isRLSError) {
    console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  🔒 RLS POLICY VIOLATION DETECTED                                ║
╠══════════════════════════════════════════════════════════════════╣
║  The insert was blocked by Row Level Security.                   ║
║                                                                  ║
║  Common causes:                                                  ║
║  1. auth.uid() is NULL (user not authenticated)                  ║
║  2. auth.uid() doesn't match the user_id being inserted          ║
║  3. User doesn't exist in the profiles table (FK constraint)     ║
║                                                                  ║
║  Debug steps:                                                    ║
║  - Check: const { data: { user } } = await supabase.auth.getUser()║
║  - Verify user.id matches the row's user_id                      ║
║  - Run: SELECT auth.uid(); in SQL Editor when logged in          ║
╚══════════════════════════════════════════════════════════════════╝
    `)
  }

  if (debug?.isSchemaError) {
    console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  📋 SCHEMA ERROR DETECTED                                        ║
╠══════════════════════════════════════════════════════════════════╣
║  A column or table doesn't exist in the database.                ║
║                                                                  ║
║  Common causes:                                                  ║
║  1. Inserting into a column that doesn't exist                   ║
║  2. Table schema out of sync with code                           ║
║                                                                  ║
║  Debug steps:                                                    ║
║  - Check column names in Supabase Dashboard → Table Editor       ║
║  - Compare INSERT columns with actual schema                     ║
╚══════════════════════════════════════════════════════════════════╝
    `)
  }

  if (debug?.isForeignKeyError) {
    console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  🔗 FOREIGN KEY VIOLATION                                        ║
╠══════════════════════════════════════════════════════════════════╣
║  The referenced row doesn't exist in the parent table.           ║
║                                                                  ║
║  For user_id → profiles(id):                                     ║
║  - User must exist in profiles table before inserting summaries  ║
║  - Run: SELECT * FROM profiles WHERE id = 'user-uuid';           ║
╚══════════════════════════════════════════════════════════════════╝
    `)
  }
}

/**
 * Check if user is properly authenticated for RLS
 */
export async function checkRLSAuth(supabase: any): Promise<{
  isAuthenticated: boolean
  userId: string | null
  error: string | null
}> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return { isAuthenticated: false, userId: null, error: error.message }
    }
    
    if (!user) {
      return { isAuthenticated: false, userId: null, error: "No user session" }
    }
    
    return { isAuthenticated: true, userId: user.id, error: null }
  } catch (e) {
    return { 
      isAuthenticated: false, 
      userId: null, 
      error: e instanceof Error ? e.message : "Unknown auth error" 
    }
  }
}

/**
 * Verify user exists in profiles table (required before FK inserts)
 */
export async function checkUserProfile(
  supabase: any, 
  userId: string
): Promise<{ exists: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single()
    
  if (error) {
    return { exists: false, error: error.message }
  }
  
  return { exists: !!data, error: null }
}

/**
 * Corrected insert example with full error handling
 */
export async function safeSupabaseInsert<T extends Record<string, any>>(
  supabase: any,
  table: string,
  data: T,
  options?: { upsert?: boolean }
): Promise<{ success: boolean; error: SupabaseDebugInfo | null; data: any }> {
  try {
    // Pre-flight RLS check
    const authCheck = await checkRLSAuth(supabase)
    if (!authCheck.isAuthenticated) {
      console.error("[Supabase] Auth check failed:", authCheck.error)
      return {
        success: false,
        error: {
          message: authCheck.error || "Not authenticated",
          details: null,
          hint: "User must be logged in for RLS-protected tables",
          code: "AUTH_REQUIRED",
          isRLSError: true,
          isSchemaError: false,
          isForeignKeyError: false,
          isAuthError: true,
        },
        data: null,
      }
    }

    // Perform insert or upsert
    const query = options?.upsert 
      ? supabase.from(table).upsert(data).select()
      : supabase.from(table).insert(data).select()
    
    const { data: result, error, status, statusText } = await query
    
    // Log full response for debugging
    console.log(`[Supabase] ${table} ${options?.upsert ? 'upsert' : 'insert'} response:`, {
      status,
      statusText,
      hasData: !!result,
      hasError: !!error,
    })

    if (error) {
      logSupabaseError(`${table} insert`, error, { 
        insertedData: data,
        authUserId: authCheck.userId 
      })
      return { success: false, error: debugSupabaseError(error), data: null }
    }

    return { success: true, error: null, data: result }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Unknown error"
    console.error("[Supabase] Unexpected error:", errorMsg)
    return {
      success: false,
      error: {
        message: errorMsg,
        details: null,
        hint: null,
        code: "UNEXPECTED",
        isRLSError: false,
        isSchemaError: false,
        isForeignKeyError: false,
        isAuthError: false,
      },
      data: null,
    }
  }
}
