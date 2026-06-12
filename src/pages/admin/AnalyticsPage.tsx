import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import {
  DateRangeSelector,
  AnalyticsMetricBar,
  EventLineChart,
  TopDishesTable,
  DeviceBreakdown,
  ConversionFunnel,
  MenuEngineeringMatrix,
  HourlyHeatmap,
  WeekComparisonChart,
  useAnalyticsSummaries,
  useDishNameMap,
  useConversionFunnel,
  useMenuEngineering,
  useHourlyHeatmap,
  useWeekComparison,
} from '@features/analytics'
import { UpgradeGate } from '@features/billing'
import { Button } from '@shared/ui/components/Button'
import { useQueryClient } from '@tanstack/react-query'
import { analyticsQueryKeys } from '@features/analytics/types/analytics.types'
import type { DailySummary, DateRange } from '@features/analytics'

export default function AnalyticsPage() {
  const { tenantId, tenant } = useTenantContext()
  const queryClient = useQueryClient()
  const [days, setDays] = useState<DateRange>(30)

  const {
    data: summaries = [],
    isLoading,
    dataUpdatedAt,
  } = useAnalyticsSummaries(tenantId, days)

  const { data: dishNameMap = new Map() } = useDishNameMap(tenantId)

  const handleRefresh = () => {
    void queryClient.invalidateQueries({
      queryKey: analyticsQueryKeys.summaries(tenantId, days),
    })
  }

  const handleExportCSV = () => {
    if (summaries.length === 0) return

    const headers = ['Fecha', 'Total', 'QR Scans', 'Vistas Menú', 'Vistas Plato', 'AR Lanzamientos']
    const rows = summaries.map((s) => [
      s.date,
      s.totalEvents,
      s.counts['qr_scan'] ?? 0,
      s.counts['menu_view'] ?? 0,
      s.counts['dish_view'] ?? 0,
      s.counts['ar_launch'] ?? 0,
    ])

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${tenant?.slug ?? tenantId}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Rendimiento
          </p>
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-zinc-900">
            Analíticas
          </h1>
          <p className="text-[13px] text-zinc-500">
            {lastUpdated ? `Actualizado a las ${lastUpdated}` : 'Datos de rendimiento del menú'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DateRangeSelector value={days} onChange={setDays} />

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 bg-white hover:bg-zinc-50 hover:text-zinc-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            aria-label="Actualizar"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            disabled={isLoading || summaries.length === 0}
            className="rounded-xl shadow-sm font-semibold"
          >
            <Download size={13} className="mr-1.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      <AnalyticsMetricBar summaries={summaries} isLoading={isLoading} />

      {/* Line chart */}
      <EventLineChart summaries={summaries} isLoading={isLoading} />

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopDishesTable
            summaries={summaries}
            dishNameMap={dishNameMap}
            isLoading={isLoading}
          />
        </div>
        <DeviceBreakdown summaries={summaries} isLoading={isLoading} />
      </div>

      {/* ── Analytics Pro ── */}
      <div className="mt-2 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Analytics Pro
        </p>
        <h2 className="text-[18px] font-bold tracking-[-0.01em] text-zinc-900">
          Inteligencia del negocio
        </h2>
      </div>

      <UpgradeGate feature="analytics_pro">
        <ProSection tenantId={tenantId} days={days} summaries={summaries} isLoading={isLoading} />
      </UpgradeGate>
    </div>
  )
}

// ─── Sección Pro (solo se monta si el plan incluye analytics_pro) ─────────────

interface ProSectionProps {
  readonly tenantId: string
  readonly days: DateRange
  readonly summaries: DailySummary[]
  readonly isLoading: boolean
}

function ProSection({ tenantId, days, summaries, isLoading }: ProSectionProps) {
  const funnelStages = useConversionFunnel(summaries)
  const engineering = useMenuEngineering(tenantId, days)
  const heatmap = useHourlyHeatmap(tenantId, days)
  const weekComparison = useWeekComparison(tenantId)

  return (
    <div className="flex flex-col gap-4">
      <ConversionFunnel stages={funnelStages} isLoading={isLoading} />
      <MenuEngineeringMatrix
        points={engineering.points}
        popularityCut={engineering.popularityCut}
        profitabilityCut={engineering.profitabilityCut}
        isLoading={engineering.isLoading}
      />
      <HourlyHeatmap
        matrix={heatmap.matrix}
        maxCount={heatmap.maxCount}
        isLoading={heatmap.isLoading}
      />
      <WeekComparisonChart
        thisWeek={weekComparison.thisWeek}
        lastWeek={weekComparison.lastWeek}
        isLoading={weekComparison.isLoading}
      />
    </div>
  )
}
