"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteAccount } from "@/lib/account-actions"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"

interface DeleteAccountButtonProps {
  className?: string
}

export function DeleteAccountButton({ className }: DeleteAccountButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteContent, setDeleteContent] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm")
      return
    }

    setLoading(true)
    setError(null)

    const result = await deleteAccount(deleteContent)

    if (result.success) {
      router.push("/?deleted=true")
    } else {
      setError(result.error || "Failed to delete account")
      setLoading(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className={`flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${className}`}
      >
        <Trash2 className="w-4 h-4" />
        Delete Account
      </button>
    )
  }

  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-700 dark:text-red-400">
            Delete Your Account
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            This action cannot be undone. Your account will be deactivated and you will be signed out.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteContent}
            onChange={(e) => setDeleteContent(e.target.checked)}
            className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Also delete all my videos, documents, and translations
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type <span className="font-mono font-bold">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleDelete}
          disabled={loading || confirmText !== "DELETE"}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {loading ? "Deleting..." : "Delete My Account"}
        </button>
        <button
          onClick={() => {
            setShowConfirm(false)
            setConfirmText("")
            setError(null)
          }}
          disabled={loading}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
