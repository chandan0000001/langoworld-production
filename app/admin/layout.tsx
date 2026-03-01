import { requireAdmin } from "./lib/admin-auth"
import { AdminNav } from "./components/admin-nav"

export const metadata = {
  title: "Admin Panel | LangoWorld",
  description: "LangoWorld Administration Dashboard",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side admin check - redirects non-admins
  const { profile } = await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNav username={profile.username} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
