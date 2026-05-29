"use client"

import { useState } from "react"
import { Trash2, RefreshCw, Eye, Loader2 } from "lucide-react"
import Link from "next/link"

interface ContentItem {
  id: string
  video_title: string
  video_url?: string
  source: string
  created_at: string
  profiles?: {
    username: string
  }
}

interface ContentTableProps {
  items: ContentItem[]
  type: "video" | "document"
  onDelete: (id: string) => Promise<void>
  onReprocess: (id: string) => Promise<void>
}

export function ContentTable({ items, type, onDelete, onReprocess }: ContentTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<"delete" | "reprocess" | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item? This cannot be undone.")) {
      return
    }
    
    setLoadingId(id)
    setActionType("delete")
    try {
      await onDelete(id)
    } finally {
      setLoadingId(null)
      setActionType(null)
    }
  }

  const handleReprocess = async (id: string) => {
    if (!confirm("This will clear the AI-generated content and mark it for re-processing. Continue?")) {
      return
    }
    
    setLoadingId(id)
    setActionType("reprocess")
    try {
      await onReprocess(id)
    } finally {
      setLoadingId(null)
      setActionType(null)
    }
  }

  const getViewUrl = (item: ContentItem) => {
    if (type === "document") return `/docs/${item.id}`
    if (item.source === "youtube") return `/yt/summary/${item.id}`
    return `/video/${item.id}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "youtube":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">YouTube</span>
      case "upload":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Upload</span>
      case "document":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Document</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{source}</span>
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No {type}s found</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.video_title}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getSourceBadge(item.source)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.profiles?.username || "Unknown"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(item.created_at)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {/* View Button */}
                    <Link
                      href={getViewUrl(item)}
                      target="_blank"
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      title="View Summary"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    
                    {/* Reprocess Button */}
                    <button
                      onClick={() => handleReprocess(item.id)}
                      disabled={loadingId === item.id}
                      className="p-2 text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                      title="Re-run AI Processing"
                    >
                      {loadingId === item.id && actionType === "reprocess" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={loadingId === item.id}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {loadingId === item.id && actionType === "delete" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
