"use client"

import { useState, useEffect, useCallback } from "react"
import { getVideos, deleteVideo, markForReprocessing, searchContent } from "../lib/admin-actions"
import { ContentTable } from "../components/content-table"
import { Pagination } from "../components/pagination"
import { Search, Video, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface VideoItem {
  id: string
  video_title: string
  video_url: string
  source: string
  created_at: string
  profiles?: {
    username: string
  }
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)

  const loadVideos = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const result = await getVideos(pageNum)
      // Map profiles from array to object (Supabase inner join returns array)
      const mappedVideos = result.videos.map((v: any) => ({
        ...v,
        profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
      }))
      setVideos(mappedVideos)
      setTotalPages(result.totalPages)
      setTotal(result.total)
      setPage(pageNum)
    } catch (error) {
      console.error("Failed to load videos:", error)
      toast.error("Failed to load videos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVideos(1)
  }, [loadVideos])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      loadVideos(1)
      return
    }

    setSearching(true)
    try {
      const results = await searchContent(searchQuery, "video")
      const mappedResults = results.map((v: any) => ({
        ...v,
        profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
      }))
      setVideos(mappedResults)
      setTotalPages(1)
      setTotal(results.length)
    } catch (error) {
      console.error("Search failed:", error)
      toast.error("Search failed")
    } finally {
      setSearching(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteVideo(id)
      toast.success("Video deleted successfully")
      setVideos(videos.filter(v => v.id !== id))
      setTotal(prev => prev - 1)
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error("Failed to delete video")
    }
  }

  const handleReprocess = async (id: string) => {
    try {
      await markForReprocessing(id)
      toast.success("Video marked for re-processing")
    } catch (error) {
      console.error("Reprocess failed:", error)
      toast.error("Failed to mark for re-processing")
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    loadVideos(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Videos</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {total} total videos (YouTube & uploads)
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          <ContentTable
            items={videos}
            type="video"
            onDelete={handleDelete}
            onReprocess={handleReprocess}
          />
          
          {!searchQuery && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={loadVideos}
            />
          )}
        </>
      )}
    </div>
  )
}
