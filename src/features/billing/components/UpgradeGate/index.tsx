import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'

import type { PlanFeature } from '@core/domain/entities/Subscription'
import { PLAN_FEATURE_LABELS } from '@shared/constants/plans'
import { ROUTES } from '@shared/constants/routes'

import { usePlan } from '../../hooks/usePlan'

interface UpgradeGateProps {
  readonly feature: PlanFeature
  readonly children: ReactNode
  /** Tema oscuro para pantallas fullscreen (KDS/POS). */
  readonly dark?: boolean
}

/**
 * Muestra `children` solo si el plan actual incluye la feature.
 * Si no, renderiza un CTA de upgrade hacia /admin/plan.
 */
export function UpgradeGate({ feature, children, dark = false }: UpgradeGateProps) {
  const { can, isLoading } = usePlan()

  // Mientras carga la suscripción no parpadeamos el candado.
  if (isLoading) return null
  if (can(feature)) return <>{children}</>

  const textColor = dark ? 'rgba(255,255,255,0.85)' : '#171717'
  const subColor = dark ? 'rgba(255,255,255,0.45)' : '#737373'

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl p-8 text-center"
      style={{
        background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
        border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}
      >
        <Lock size={22} style={{ color: '#8b5cf6' }} />
      </div>
      <div>
        <h2 className="text-base font-black" style={{ color: textColor }}>
          {PLAN_FEATURE_LABELS[feature]}
        </h2>
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed" style={{ color: subColor }}>
          Esta función no está incluida en tu plan actual. Actualiza tu plan para desbloquearla.
        </p>
      </div>
      <Link
        to={ROUTES.admin.plan}
        className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-[13px] font-black text-white transition-transform active:scale-95"
        style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
      >
        <Sparkles size={14} /> Ver planes
      </Link>
    </div>
  )
}
