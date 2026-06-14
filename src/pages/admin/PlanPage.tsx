import { CalendarClock, Crown, MessageCircle } from 'lucide-react'
import { PageHeader } from '@shared/ui/components/PageHeader'

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

// ─── Header Info ──────────────────────────────────────────────────────────────
function PlanHeader() {
  return (
    <div className="mb-8">
      <PageHeader
        eyebrow="Cuenta"
        title="Mi Plan"
        subtitle="Administra los límites de tu restaurante y adquiere funcionalidades avanzadas."
      />
    </div>
  )
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
    <div className="mx-auto max-w-5xl pb-16">
      <PlanHeader />

      <div className="flex flex-col gap-10">
        
        {/* Plan actual */}
        <div className="group relative overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-white p-1">
          <div className="absolute -right-20 -top-20 z-0 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 rounded-[22px] bg-white/60 p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                <Crown size={14} /> Tu plan actual
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-black tracking-tight text-neutral-900">{definition.name}</h2>
                <div className="scale-110 origin-left">
                  <PlanBadge plan={plan} />
                </div>
              </div>
              <p className="text-[14px] font-medium text-neutral-600 max-w-md">{definition.tagline}</p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 border-t border-amber-100 pt-6 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0">
              <p className="text-4xl font-black tracking-tighter text-neutral-900 flex items-baseline gap-1">
                ${definition.priceUsd}
                <span className="text-[14px] font-bold text-neutral-400">/mes</span>
              </p>
              
              {isTrialing && (
                <div className="mt-1 flex items-center gap-2 rounded-xl bg-amber-100/80 px-3 py-1.5 text-[12px] font-black text-amber-800 shadow-sm border border-amber-200">
                  <CalendarClock size={14} className="text-amber-600" />
                  {trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''} de prueba restante{trialDaysLeft !== 1 ? 's' : ''}
                </div>
              )}
              
              {subscription?.currentPeriodEnd && !isTrialing && (
                <p className="text-[13px] font-medium text-neutral-500 bg-white/80 px-3 py-1.5 rounded-lg border border-black/[0.04]">
                  Renueva el <strong className="text-neutral-800">{subscription.currentPeriodEnd.toLocaleDateString('es-CR')}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div>
              <h3 className="text-xl font-black text-neutral-900 tracking-tight">Comparativa de Planes</h3>
              <p className="text-[13.5px] font-medium text-neutral-500 mt-1">Elige el nivel que mejor se adapte al volumen de tu operación.</p>
           </div>
          {/* Comparativa */}
          <PlanComparison currentPlan={plan} onSelectPlan={handleSelectPlan} />
        </div>

        <div className="flex items-center justify-center mt-4">
          <a
            href={buildWhatsAppUrl(PLATFORM.salesWhatsApp, 'Hola, tengo dudas sobre los planes')}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 px-8 py-6 text-center transition-all hover:border-emerald-300 hover:bg-emerald-50/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100 text-emerald-500 group-hover:scale-110 transition-transform">
              <MessageCircle size={22} />
            </div>
            <div>
              <p className="text-[14px] font-black text-neutral-800">¿Tienes dudas sobre tu facturación?</p>
              <p className="mt-1 text-[13px] font-medium text-neutral-500">
                Escríbenos a {PLATFORM.salesEmail} o por WhatsApp — te ayudamos a elegir.
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
