"use server"

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export interface DeleteAccountResult {
  success: boolean
  error?: string
}

/**
 * Soft delete the current user's account
 * Sets deleted_at timestamp, does NOT hard delete from auth.users
 * 
 * @param deleteContent - If true, also deletes user's summaries and translations
 */
export async function deleteAccount(deleteContent: boolean = false): Promise<DeleteAccountResult> {
  const supabase = await createClient()
  
  // Verify authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }
  
  try {
    // Optionally delete user content first
    if (deleteContent) {
      // Delete translations (cascade will handle this via summaries FK)
      // Delete summaries
      const { error: summariesError } = await supabase
        .from("summaries")
        .delete()
        .eq("user_id", user.id)
      
      if (summariesError) {
        console.error("[deleteAccount] Failed to delete summaries:", summariesError)
        // Continue with soft delete even if content deletion fails
      }
      
      // Delete translation history
      const { error: historyError } = await supabase
        .from("translation_history")
        .delete()
        .eq("user_id", user.id)
      
      if (historyError) {
        console.error("[deleteAccount] Failed to delete translation history:", historyError)
      }
    }
    
    // Soft delete: Set deleted_at timestamp
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", user.id)
    
    if (updateError) {
      console.error("[deleteAccount] Failed to soft delete profile:", updateError)
      return { success: false, error: "Failed to delete account" }
    }
    
    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error("[deleteAccount] Failed to sign out:", signOutError)
      // Account is deleted, sign out failure is not critical
    }
    
    revalidatePath("/")
    
    return { success: true }
    
  } catch (error) {
    console.error("[deleteAccount] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Check if current user's account is soft deleted
 */
export async function isAccountDeleted(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("deleted_at")
    .eq("id", user.id)
    .single()
  
  return profile?.deleted_at !== null
}
