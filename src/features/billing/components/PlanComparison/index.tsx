import { Check } from 'lucide-react'

import type { PlanId } from '@core/domain/entities/Subscription'
import {
  PLANS,
  PLAN_ORDER,
  PLAN_FEATURE_LABELS,
  PLAN_LIMIT_LABELS,
  formatLimit,
} from '@shared/constants/plans'
import type { PlanLimits } from '@shared/constants/plans'

interface PlanComparisonProps {
  readonly currentPlan: PlanId
  /** CTA por plan (WhatsApp o Stripe Payment Link). */
  readonly onSelectPlan: (plan: PlanId) => void
}

const LIMIT_KEYS: readonly (keyof PlanLimits)[] = ['dishes', 'menus', 'tables', 'arModels']

export function PlanComparison({ currentPlan, onSelectPlan }: PlanComparisonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {PLAN_ORDER.map((planId) => {
        const plan = PLANS[planId]
        const isCurrent = planId === currentPlan

        return (
          <div
            key={planId}
            className="relative flex flex-col gap-4 rounded-3xl border bg-white p-5 shadow-sm"
            style={{
              borderColor: plan.highlighted ? 'rgba(139,92,246,0.45)' : 'rgba(0,0,0,0.07)',
              boxShadow: plan.highlighted ? '0 8px 24px rgba(139,92,246,0.12)' : undefined,
            }}
          >
            {plan.highlighted && (
              <span
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
                style={{ background: '#7c3aed' }}
              >
                Recomendado
              </span>
            )}

            <div>
              <h3 className="text-[15px] font-black text-neutral-900">{plan.name}</h3>
              <p className="text-[12px] text-neutral-500">{plan.tagline}</p>
            </div>

            <p className="text-3xl font-black text-neutral-900">
              ${plan.priceUsd}
              <span className="text-[12px] font-bold text-neutral-400">/mes</span>
            </p>

            {/* Límites */}
            <div className="flex flex-col gap-1.5 border-t border-black/[0.05] pt-3">
              {LIMIT_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-neutral-500">{PLAN_LIMIT_LABELS[key]}</span>
                  <span className="font-black text-neutral-800">{formatLimit(plan.limits[key])}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            {plan.features.length > 0 && (
              <ul className="flex flex-col gap-1.5 border-t border-black/[0.05] pt-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-[12.5px] text-neutral-700">
                    <Check size={13} className="shrink-0 text-green-600" strokeWidth={2.6} />
                    {PLAN_FEATURE_LABELS[feature]}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              disabled={isCurrent}
              onClick={() => onSelectPlan(planId)}
              className={`mt-auto w-full rounded-2xl py-2.5 text-[13px] font-black transition-all active:scale-95 ${
                isCurrent
                  ? 'cursor-default border border-black/[0.08] text-neutral-400'
                  : 'text-white'
              }`}
              style={
                isCurrent
                  ? undefined
                  : { background: plan.highlighted ? '#7c3aed' : '#171717' }
              }
            >
              {isCurrent ? 'Plan actual' : `Activar ${plan.name}`}
            </button>
          </div>
        )
      })}
    </div>
  )
}
