import { getAdminStats } from "./lib/admin-actions"
import { StatsCard } from "./components/stats-card"
import { Users, Video, FileText, Languages, Clock } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "youtube":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">YouTube</span>
      case "upload":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Upload</span>
      case "document":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Document</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Overview of LangoWorld platform statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.usersCount}
          icon={Users}
          description="Registered users"
        />
        <StatsCard
          title="Videos"
          value={stats.videosCount}
          icon={Video}
          description="YouTube & uploads"
        />
        <StatsCard
          title="Documents"
          value={stats.documentsCount}
          icon={FileText}
          description="Processed documents"
        />
        <StatsCard
          title="Translations"
          value={stats.translationsCount}
          icon={Languages}
          description="Cached translations"
        />
      </div>

      {/* Recent Uploads */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Uploads
            </h2>
          </div>
          <Link
            href="/admin/videos"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            View all →
          </Link>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {stats.recentUploads.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No uploads yet
            </div>
          ) : (
            stats.recentUploads.map((upload: any) => (
              <div
                key={upload.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {upload.video_title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      by {upload.profiles?.username || "Unknown"}
                    </span>
                    {getSourceBadge(upload.source)}
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-4">
                  {formatDate(upload.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/videos"
          className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
              <Video className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Manage Videos
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View, delete, or reprocess video summaries
              </p>
            </div>
          </div>
        </Link>
        
        <Link
          href="/admin/documents"
          className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Manage Documents
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View, delete, or reprocess document summaries
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
