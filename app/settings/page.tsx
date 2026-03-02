import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { SettingsContent } from "./settings-content"

export const metadata = {
  title: "Settings | LangoWorld",
  description: "Manage your LangoWorld account settings",
}

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .single()
  
  if (!profile) {
    redirect("/username")
  }
  
  return (
    <SettingsContent 
      user={{ email: user.email || "" }}
      profile={profile}
    />
  )
}
