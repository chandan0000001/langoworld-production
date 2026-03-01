import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, icon: Icon, description, trend }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {description}
            </p>
          )}
          {trend && (
            <p className={`text-xs mt-2 ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
          <Icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
      </div>
    </div>
  )
}
