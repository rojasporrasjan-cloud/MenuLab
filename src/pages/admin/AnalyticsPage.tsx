import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { PageHeader } from '@shared/ui/components/PageHeader'
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
import { useQueryClient } from '@tanstack/react-query'
import { analyticsQueryKeys } from '@features/analytics/types/analytics.types'
import type { DailySummary, DateRange } from '@features/analytics'

// ─── Header Info ──────────────────────────────────────────────────────────────
function AnalyticsHeader({ 
  lastUpdated, 
  days, 
  setDays, 
  isLoading, 
  onRefresh, 
  onExport, 
  hasData 
}: { 
  lastUpdated: string | null;
  days: DateRange;
  setDays: (days: DateRange) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  hasData: boolean;
}) {
  return (
    <div className="mb-6">
      <PageHeader
        eyebrow="Datos"
        title="Analíticas"
        subtitle={`Métricas de rendimiento en tiempo real. ${lastUpdated ? `Sincronizado a las ${lastUpdated}` : 'Sincronizando datos…'}`}
        actions={
          <>
            <DateRangeSelector value={days} onChange={setDays} />
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 transition-colors hover:bg-surface-50 active:scale-95 disabled:opacity-50"
              aria-label="Actualizar"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={isLoading || !hasData}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-40"
            >
              <Download size={16} /> Exportar CSV
            </button>
          </>
        }
      />
    </div>
  )
}

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
    <div className="mx-auto max-w-6xl pb-12">
      <AnalyticsHeader 
        lastUpdated={lastUpdated} 
        days={days} 
        setDays={setDays} 
        isLoading={isLoading} 
        onRefresh={handleRefresh} 
        onExport={handleExportCSV} 
        hasData={summaries.length > 0} 
      />

      <div className="flex flex-col gap-6">
        {/* KPI tiles */}
        <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
          <AnalyticsMetricBar summaries={summaries} isLoading={isLoading} />
        </div>

        {/* Line chart */}
        <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm overflow-hidden">
          <EventLineChart summaries={summaries} isLoading={isLoading} />
        </div>

        {/* Bottom row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
            <TopDishesTable
              summaries={summaries}
              dishNameMap={dishNameMap}
              isLoading={isLoading}
            />
          </div>
          <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
            <DeviceBreakdown summaries={summaries} isLoading={isLoading} />
          </div>
        </div>

        {/* ── Analytics Pro ── */}
        <div className="mt-8 mb-2 px-2 flex items-center justify-between">
           <div>
             <h2 className="text-xl font-black text-neutral-900 tracking-tight">Inteligencia de Negocio</h2>
             <p className="text-[13.5px] font-medium text-neutral-500 mt-1">Descubre oportunidades ocultas en tu operación (Analytics Pro)</p>
           </div>
        </div>

        <UpgradeGate feature="analytics_pro">
          <ProSection tenantId={tenantId} days={days} summaries={summaries} isLoading={isLoading} />
        </UpgradeGate>
      </div>
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
    <div className="flex flex-col gap-6">
       <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
         <ConversionFunnel stages={funnelStages} isLoading={isLoading} />
       </div>
       <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm overflow-x-auto">
        <MenuEngineeringMatrix
          points={engineering.points}
          popularityCut={engineering.popularityCut}
          profitabilityCut={engineering.profitabilityCut}
          isLoading={engineering.isLoading}
        />
       </div>
       <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm overflow-x-auto">
        <HourlyHeatmap
          matrix={heatmap.matrix}
          maxCount={heatmap.maxCount}
          isLoading={heatmap.isLoading}
        />
       </div>
       <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
        <WeekComparisonChart
          thisWeek={weekComparison.thisWeek}
          lastWeek={weekComparison.lastWeek}
          isLoading={weekComparison.isLoading}
        />
      </div>
    </div>
  )
}
