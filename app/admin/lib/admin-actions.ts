"use server"

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

/**
 * Verify admin role before any action
 * This is called at the start of every server action
 */
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Unauthorized: Not authenticated")
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }
  
  return { supabase, user }
}

// ════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════

export async function getAdminStats() {
  const { supabase } = await verifyAdmin()
  
  // Get total users count
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
  
  // Get videos count (source = 'youtube' or 'upload')
  const { count: videosCount } = await supabase
    .from("summaries")
    .select("*", { count: "exact", head: true })
    .in("source", ["youtube", "upload"])
  
  // Get documents count (source = 'document')
  const { count: documentsCount } = await supabase
    .from("summaries")
    .select("*", { count: "exact", head: true })
    .eq("source", "document")
  
  // Get total summaries count
  const { count: totalSummaries } = await supabase
    .from("summaries")
    .select("*", { count: "exact", head: true })
  
  // Get translations count
  const { count: translationsCount } = await supabase
    .from("translations")
    .select("*", { count: "exact", head: true })
  
  // Get recent uploads (last 10)
  const { data: recentUploads } = await supabase
    .from("summaries")
    .select(`
      id,
      video_title,
      source,
      created_at,
      user_id,
      profiles!inner(username)
    `)
    .order("created_at", { ascending: false })
    .limit(10)
  
  return {
    usersCount: usersCount || 0,
    videosCount: videosCount || 0,
    documentsCount: documentsCount || 0,
    totalSummaries: totalSummaries || 0,
    translationsCount: translationsCount || 0,
    recentUploads: recentUploads || [],
  }
}

// ════════════════════════════════════════════════════════════
// VIDEO MANAGEMENT
// ════════════════════════════════════════════════════════════

export async function getVideos(page = 1, limit = 20) {
  const { supabase } = await verifyAdmin()
  
  const offset = (page - 1) * limit
  
  const { data, count, error } = await supabase
    .from("summaries")
    .select(`
      id,
      video_url,
      video_title,
      channel,
      source,
      created_at,
      user_id,
      profiles!inner(username)
    `, { count: "exact" })
    .in("source", ["youtube", "upload"])
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  
  return {
    videos: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getVideoDetails(id: string) {
  const { supabase } = await verifyAdmin()
  
  const { data, error } = await supabase
    .from("summaries")
    .select(`
      *,
      profiles!inner(username, display_name)
    `)
    .eq("id", id)
    .single()
  
  if (error) throw error
  return data
}

export async function deleteVideo(id: string) {
  const { supabase } = await verifyAdmin()
  
  // Delete associated translations first
  await supabase
    .from("translations")
    .delete()
    .eq("summary_id", id)
  
  // Delete the summary
  const { error } = await supabase
    .from("summaries")
    .delete()
    .eq("id", id)
  
  if (error) throw error
  
  revalidatePath("/admin/videos")
  revalidatePath("/admin")
  
  return { success: true }
}

// ════════════════════════════════════════════════════════════
// DOCUMENT MANAGEMENT
// ════════════════════════════════════════════════════════════

export async function getDocuments(page = 1, limit = 20) {
  const { supabase } = await verifyAdmin()
  
  const offset = (page - 1) * limit
  
  const { data, count, error } = await supabase
    .from("summaries")
    .select(`
      id,
      video_url,
      video_title,
      source,
      created_at,
      user_id,
      profiles!inner(username)
    `, { count: "exact" })
    .eq("source", "document")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  
  return {
    documents: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getDocumentDetails(id: string) {
  const { supabase } = await verifyAdmin()
  
  const { data, error } = await supabase
    .from("summaries")
    .select(`
      *,
      profiles!inner(username, display_name)
    `)
    .eq("id", id)
    .single()
  
  if (error) throw error
  return data
}

export async function deleteDocument(id: string) {
  const { supabase } = await verifyAdmin()
  
  // Delete associated translations first
  await supabase
    .from("translations")
    .delete()
    .eq("summary_id", id)
  
  // Delete the document summary
  const { error } = await supabase
    .from("summaries")
    .delete()
    .eq("id", id)
  
  if (error) throw error
  
  revalidatePath("/admin/documents")
  revalidatePath("/admin")
  
  return { success: true }
}

// ════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ════════════════════════════════════════════════════════════

export async function getUsers(page = 1, limit = 20) {
  const { supabase } = await verifyAdmin()
  
  const offset = (page - 1) * limit
  
  const { data, count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  
  return {
    users: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

// ════════════════════════════════════════════════════════════
// RE-PROCESS AI
// This marks a summary for re-processing by clearing the summary
// The actual re-processing would be triggered by the user viewing
// the content again, or by a background job
// ════════════════════════════════════════════════════════════

export async function markForReprocessing(id: string) {
  const { supabase } = await verifyAdmin()
  
  // Clear the summary to trigger re-processing
  // Keep the basic info (title, url) but clear AI-generated content
  const { error } = await supabase
    .from("summaries")
    .update({
      summary: "",
      key_points: [],
      explanation: "",
      tts_summary: "",
      chapters: [],
    })
    .eq("id", id)
  
  if (error) throw error
  
  revalidatePath("/admin/videos")
  revalidatePath("/admin/documents")
  
  return { success: true, message: "Content marked for re-processing" }
}

// ════════════════════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════════════════════

export async function searchContent(query: string, type: "video" | "document" | "all" = "all") {
  const { supabase } = await verifyAdmin()
  
  let sourceFilter: string[] = []
  if (type === "video") sourceFilter = ["youtube", "upload"]
  else if (type === "document") sourceFilter = ["document"]
  else sourceFilter = ["youtube", "upload", "document"]
  
  const { data, error } = await supabase
    .from("summaries")
    .select(`
      id,
      video_url,
      video_title,
      source,
      created_at,
      user_id,
      profiles!inner(username)
    `)
    .in("source", sourceFilter)
    .or(`video_title.ilike.%${query}%,video_url.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(50)
  
  if (error) throw error
  
  return data || []
}
