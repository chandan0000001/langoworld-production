import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

/**
 * Server-side admin authentication check
 * Call this in server components/actions to verify admin role
 * Returns user data if admin, redirects to homepage otherwise
 */
export async function requireAdmin() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // DEBUG: Log auth result
  console.log("[requireAdmin] Auth result:", { 
    hasUser: !!user, 
    userId: user?.id,
    userEmail: user?.email,
    authError: authError?.message 
  })
  
  if (authError || !user) {
    console.log("[requireAdmin] Redirecting to /login - no user or auth error")
    redirect("/login")
  }
  
  // Check admin role in profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, role")
    .eq("id", user.id)
    .single()
  
  // DEBUG: Log profile query result
  console.log("[requireAdmin] Profile query:", {
    hasProfile: !!profile,
    profile,
    profileError: profileError?.message,
    profileErrorCode: profileError?.code
  })
  
  if (profileError || !profile || profile.role !== "admin") {
    console.log("[requireAdmin] Redirecting to / - profile issue:", {
      hasError: !!profileError,
      hasProfile: !!profile,
      role: profile?.role
    })
    redirect("/")
  }
  
  return { user, profile }
}

/**
 * Check if current user is admin (non-redirecting version)
 * Useful for conditional rendering
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  return profile?.role === "admin"
}

/**
 * Get admin user data (returns null if not admin)
 */
export async function getAdminUser() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, role")
    .eq("id", user.id)
    .single()
  
  if (!profile || profile.role !== "admin") return null
  
  return { user, profile }
}
