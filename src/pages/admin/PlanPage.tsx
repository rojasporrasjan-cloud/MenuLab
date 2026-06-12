import { CalendarClock } from 'lucide-react'

import { useTenantContext } from '@app/providers/TenantProvider'
import { usePlan, PlanBadge, PlanComparison } from '@features/billing'
import type { PlanId } from '@core/domain/entities/Subscription'
import { PLANS } from '@shared/constants/plans'
import { PLATFORM } from '@shared/constants/brand'
import { ENV } from '@shared/config/env'
import { buildWhatsAppUrl } from '@shared/utils/whatsapp'

function buildUpgradeMessage(planName: string, restaurantName: string): string {
  return `Hola, quiero activar el plan ${planName} para mi restaurante ${restaurantName}`
}

export default function PlanPage() {
  const { tenant } = useTenantContext()
  const { plan, definition, isTrialing, trialDaysLeft, subscription } = usePlan()

  function handleSelectPlan(target: PlanId): void {
    if (target === 'free') return

    // Con Stripe configurado, el upgrade va directo al Payment Link.
    const paymentLink = ENV.stripe.publishableKey ? ENV.stripe.paymentLinks[target] : ''
    if (paymentLink) {
      window.open(paymentLink, '_blank', 'noopener,noreferrer')
      return
    }

    // Fallback: ventas por WhatsApp.
    const message = buildUpgradeMessage(PLANS[target].name, tenant?.name ?? '')
    window.open(buildWhatsAppUrl(PLATFORM.salesWhatsApp, message), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Plan actual */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Tu plan actual
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-neutral-900">{definition.name}</h2>
            <PlanBadge plan={plan} />
          </div>
          <p className="text-[13px] text-neutral-500">{definition.tagline}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <p className="text-3xl font-black text-neutral-900">
            ${definition.priceUsd}
            <span className="text-[13px] font-bold text-neutral-400">/mes</span>
          </p>
          {isTrialing && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[12px] font-bold text-amber-700">
              <CalendarClock size={12} />
              {trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''} de prueba restante{trialDaysLeft !== 1 ? 's' : ''}
            </p>
          )}
          {subscription?.currentPeriodEnd && !isTrialing && (
            <p className="text-[12px] text-neutral-400">
              Renueva el {subscription.currentPeriodEnd.toLocaleDateString('es-CR')}
            </p>
          )}
        </div>
      </div>

      {/* Comparativa */}
      <PlanComparison currentPlan={plan} onSelectPlan={handleSelectPlan} />

      <p className="text-center text-[12px] text-neutral-400">
        ¿Dudas? Escríbenos a {PLATFORM.salesEmail} o por WhatsApp — te ayudamos a elegir.
      </p>
    </div>
  )
}
