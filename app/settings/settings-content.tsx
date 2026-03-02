"use client"

import Link from "next/link"
import { ArrowLeft, User, Shield } from "lucide-react"
import { DeleteAccountButton } from "@/components/delete-account-button"

interface SettingsContentProps {
  user: { email: string }
  profile: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function SettingsContent({ user, profile }: SettingsContentProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/workspace"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Account Info Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <User className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Account Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Email
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Username
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">@{profile.username}</p>
            </div>
            {profile.display_name && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Display Name
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{profile.display_name}</p>
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 dark:border-red-800 flex items-center gap-3 bg-red-50 dark:bg-red-900/20">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-red-700 dark:text-red-400">
              Danger Zone
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <DeleteAccountButton />
          </div>
        </section>
      </main>
    </div>
  )
}
