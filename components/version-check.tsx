"use client"

import { useEffect } from "react"

const VERSION_KEY = "app_version"

export function VersionCheck() {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch("/version.json", { cache: "no-store" })
        if (!res.ok) return

        const data = await res.json()
        const serverVersion = data.version

        if (!serverVersion) return

        const storedVersion = localStorage.getItem(VERSION_KEY)

        if (!storedVersion) {
          // First visit — store version
          localStorage.setItem(VERSION_KEY, serverVersion)
          return
        }

        if (storedVersion !== serverVersion) {
          // Version changed — update and reload
          localStorage.setItem(VERSION_KEY, serverVersion)
          window.location.reload()
        }
      } catch {
        // Silently fail on network errors
      }
    }

    checkVersion()

    // Re-check on visibility change (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersion()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  return null
}
