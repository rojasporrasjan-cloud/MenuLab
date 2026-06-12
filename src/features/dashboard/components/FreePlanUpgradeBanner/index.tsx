import { Link } from 'react-router-dom'
import { TrendingUp, ChevronRight } from 'lucide-react'

import { useAnalyticsSummaries, AnalyticsPageService } from '@features/analytics'
import { usePlan } from '@features/billing'
import { ROUTES } from '@shared/constants/routes'
import { LIMITS } from '@shared/constants/limits'

interface FreePlanUpgradeBannerProps {
  readonly tenantId: string
}

const RANGE_DAYS = 7

/**
 * Banner para tenants free con tracción: si la carta tuvo ≥ N visitas
 * en 7 días, sugiere activar pedidos (upgrade).
 */
export function FreePlanUpgradeBanner({ tenantId }: FreePlanUpgradeBannerProps) {
  const { plan, isLoading: isLoadingPlan } = usePlan()
  const { data: summaries = [] } = useAnalyticsSummaries(tenantId, RANGE_DAYS)

  if (isLoadingPlan || plan !== 'free') return null

  const views = AnalyticsPageService.sumByType(summaries, 'menu_view')
  if (views < LIMITS.dashboard.freePlanUpgradeViewsThreshold) return null

  return (
    <Link
      to={ROUTES.admin.plan}
      className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:brightness-105 active:scale-[0.99]"
      style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        border: '1px solid rgba(5,150,105,0.25)',
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'rgba(5,150,105,0.12)' }}
      >
        <TrendingUp size={18} style={{ color: '#047857' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black" style={{ color: '#065f46' }}>
          Tu carta tuvo {views} visitas esta semana 🎉
        </p>
        <p className="text-[12px]" style={{ color: '#047857' }}>
          Activa pedidos en línea y convierte esas visitas en ventas.
        </p>
      </div>
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[12px] font-black text-white"
        style={{ background: '#059669' }}
      >
        Activa pedidos <ChevronRight size={13} />
      </span>
    </Link>
  )
}
