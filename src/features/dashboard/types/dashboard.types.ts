import type { LucideIcon } from 'lucide-react'
import type { AnalyticsEvent } from '@core/domain/entities/AnalyticsEvent'

export type { AnalyticsEvent }

export interface DashboardMetrics {
  activeMenus: number
  activeDishes: number
  activeTables: number
  arLaunchesLast30d: number
  qrScansLast30d: number
}

export interface MetricCardData {
  label: string
  value: number | string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'brand' | 'green' | 'blue' | 'purple'
}

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  badge?: string | number
  badgeVariant?: 'brand' | 'violet' | 'danger'
}
