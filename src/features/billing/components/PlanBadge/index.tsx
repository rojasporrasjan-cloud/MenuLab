import type { PlanId } from '@core/domain/entities/Subscription'
import { PLANS } from '@shared/constants/plans'

interface PlanBadgeProps {
  readonly plan: PlanId
}

const PLAN_BADGE_STYLES: Record<PlanId, { bg: string; text: string }> = {
  free: { bg: 'rgba(115,115,115,0.1)', text: '#525252' },
  starter: { bg: 'rgba(59,130,246,0.1)', text: '#1d4ed8' },
  pro: { bg: 'rgba(233,154,14,0.12)', text: '#b45309' },
  business: { bg: 'rgba(139,92,246,0.12)', text: '#6d28d9' },
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const style = PLAN_BADGE_STYLES[plan]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider"
      style={{ background: style.bg, color: style.text }}
    >
      {PLANS[plan].name}
    </span>
  )
}
