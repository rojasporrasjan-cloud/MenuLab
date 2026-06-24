import { useState, memo } from 'react'
import {
  QrCode,
  BarChart3,
  UtensilsCrossed,
  Copy,
  Check,
  ExternalLink,
  MailWarning,
  ShoppingBag,
  Wallet,
  Receipt,
  CalendarCheck,
  Users,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useAuth }          from '@features/auth'
import {
  MetricCard,
  QuickActions,
  ActivityFeed,
  FreePlanUpgradeBanner,
  useDashboardMetrics,
  useActivityFeed,
} from '@features/dashboard'
import { usePendingReservations } from '@features/reservations'
import { useLowStockAlerts, LowStockAlert } from '@features/inventory'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { greeting } from '@shared/utils/datetime'
import { TenantProvisioningService } from '@infrastructure/services/TenantProvisioningService'
import { TEMPLATE_DEFAULT_BRANDING, DEFAULT_TEMPLATE_ID, TEMPLATE_DEFINITIONS } from '@features/templates'
import { Spinner } from '@shared/ui/components/Spinner'
import { Button } from '@shared/ui/components/Button'
import { PageHeader } from '@shared/ui/components/PageHeader'
import type { MetricCardData } from '@features/dashboard'
import type { TemplateId } from '@core/domain/entities/Tenant'

// ─── Menu link banner ─────────────────────────────────────────────────────────

const MenuLinkBanner = memo(function MenuLinkBanner({ tenantId }: { tenantId: string }) {
  const [copied, setCopied] = useState(false)

  const menuUrl = `${window.location.origin}/${tenantId}/menu`

  const handleCopy = () => {
    void navigator.clipboard.writeText(menuUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 to-brand-100/30 p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
        <QrCode size={19} strokeWidth={2.2} />
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-700">
          Tu link del menú
        </p>
        <p className="truncate font-mono text-[13px] font-semibold text-surface-900">
          {menuUrl}
        </p>
        <p className="text-[11px] text-brand-700/70">
          Compártelo con tus clientes o imprimilo en un QR
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-bold transition-all active:scale-95 ${
            copied
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-brand-200 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50'
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={`/${tenantId}/menu`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-bold text-white transition-all hover:bg-brand-700 active:scale-95"
        >
          <ExternalLink size={13} />
          Ver menú
        </a>
      </div>
    </div>
  )
})

// ─── Staff link banner ────────────────────────────────────────────────────────

const StaffLinkBanner = memo(function StaffLinkBanner({ tenantId }: { tenantId: string }) {
  const [copied, setCopied] = useState(false)

  const staffUrl = `${window.location.origin}/${tenantId}/staff`

  const handleCopy = () => {
    void navigator.clipboard.writeText(staffUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-zinc-50 to-zinc-100/30 p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-white shadow-sm shadow-zinc-800/30">
        <Users size={19} strokeWidth={2.2} />
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
          Tu link de Staff
        </p>
        <p className="truncate font-mono text-[13px] font-semibold text-surface-900">
          {staffUrl}
        </p>
        <p className="text-[11px] text-zinc-500">
          Comparte este portal con tus empleados (POS, KDS)
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-bold transition-all active:scale-95 ${
            copied
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={`/${tenantId}/staff`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3 py-2 text-[12px] font-bold text-white transition-all hover:bg-zinc-900 active:scale-95"
        >
          <ExternalLink size={13} />
          Abrir Staff
        </a>
      </div>
    </div>
  )
})

// ─── Component ────────────────────────────────────────────────────────────────

// ─── Email verification banner ────────────────────────────────────────────────

const EmailVerificationBanner = memo(function EmailVerificationBanner() {
  const { resendVerificationEmail, resendLoading, resendSent } = useAuth()
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4"
      style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '1px solid rgba(245,158,11,0.3)',
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'rgba(245,158,11,0.12)' }}
      >
        <MailWarning size={18} style={{ color: '#b45309' }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[12px] font-semibold" style={{ color: '#92400e' }}>
          Confirma tu email
        </p>
        <p className="text-[12px]" style={{ color: '#a16207' }}>
          {resendSent
            ? 'Email enviado. Revisa tu bandeja de entrada.'
            : 'Te enviamos un link de verificación. Si no lo encontrás, podés reenviarlo.'}
        </p>
      </div>
      {!resendSent && (
        <button
          type="button"
          onClick={() => void resendVerificationEmail()}
          disabled={resendLoading}
          className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-amber-800 transition-all hover:bg-amber-50 disabled:opacity-50"
        >
          Reenviar email
        </button>
      )}
    </div>
  )
})

// ─── Provisioning Wizard ──────────────────────────────────────────────────────

function ProvisioningWizard() {
  const queryClient = useQueryClient()
  const [restaurantName, setRestaurantName] = useState('')
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantName.trim()) return

    setIsCreating(true)
    setError(null)
    try {
      const branding = TEMPLATE_DEFAULT_BRANDING[templateId as keyof typeof TEMPLATE_DEFAULT_BRANDING]
      const brandingSeed = {
        templateId,
        primaryColor: branding.primaryColor,
        backgroundColor: branding.backgroundColor,
        fontFamily: branding.fontFamily,
      }
      await TenantProvisioningService.provision({
        restaurantName: restaurantName.trim(),
        branding: brandingSeed,
      })
      await queryClient.invalidateQueries({ queryKey: ['tenant-context'] })
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'No se pudo crear el restaurante. Intenta de nuevo.'
      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[70vh]">
      <div className="w-full max-w-md bg-white border border-zinc-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-md">
            <UtensilsCrossed size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 mt-2">
            Configura tu restaurante
          </h2>
          <p className="text-sm text-zinc-500">
            Crea tu espacio de trabajo para empezar a diseñar tu menú digital.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="restaurantName" className="text-xs font-semibold text-zinc-700">
              Nombre de tu Restaurante / Soda
            </label>
            <input
              id="restaurantName"
              type="text"
              placeholder="Ej. Soda La Rústica"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
              disabled={isCreating}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">
              Elige una plantilla inicial
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {Object.entries(TEMPLATE_DEFINITIONS).map(([id, def]) => {
                // safe: las claves de TEMPLATE_DEFINITIONS son TemplateId; Object.entries las ensancha a string
                const templateKey = id as TemplateId
                const isSelected = templateId === templateKey
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTemplateId(templateKey)}
                    disabled={isCreating}
                    className={`flex flex-col gap-1.5 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 text-amber-900 shadow-sm ring-2 ring-amber-500/10'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <span className="text-sm font-semibold">{def.name}</span>
                    <span className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                      {def.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white font-semibold py-3 rounded-2xl shadow-lg mt-2"
            isLoading={isCreating}
          >
            Crear y configurar ⚡
          </Button>
        </form>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

import type { DateRangePreset } from '@features/dashboard'
import { useDateRangeMetrics } from '@features/dashboard'

export default function DashboardPage() {
  const { tenantId, tenant, isLoading: tenantLoading } = useTenantContext()
  const { user } = useAuth()

  const [dateRange, setDateRange] = useState<DateRangePreset>('today')
  
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(tenantId)
  const { events: activityItems, isLoading: activityLoading } = useActivityFeed(tenantId)
  
  const rangeMetrics = useDateRangeMetrics(tenantId ?? '', dateRange)
  const { count: pendingReservations } = usePendingReservations(tenantId ?? '')
  
  const { alerts: lowStockAlerts } = useLowStockAlerts(tenantId ?? '')

  if (tenantLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!tenantId || !tenant) {
    return <ProvisioningWizard />
  }

  const rangeCards: MetricCardData[] = [
    {
      label: 'Ingresos',
      value: formatCurrency(rangeMetrics.revenueTotal, rangeMetrics.currency),
      icon: Wallet,
      color: 'green',
    },
    {
      label: 'Pedidos',
      value: rangeMetrics.ordersCount,
      icon: ShoppingBag,
      color: 'brand',
      trend: {
        value: Math.round(rangeMetrics.ordersTrendPercent),
        isPositive: rangeMetrics.ordersTrendPositive,
      },
    },
    {
      label: 'Ticket Promedio',
      value: formatCurrency(rangeMetrics.averageTicket, rangeMetrics.currency),
      icon: Receipt,
      color: 'blue',
    },
  ]

  const metricCards: MetricCardData[] = [
    {
      label: 'Reservas pendientes',
      value: pendingReservations,
      icon: CalendarCheck,
      color: 'purple',
    },
    {
      label: 'Platos activos',
      value: metrics?.activeDishes ?? 0,
      icon: UtensilsCrossed,
      color: 'brand',
    },
    {
      label: 'Escaneos QR (30d)',
      value: metrics?.qrScansLast30d ?? 0,
      icon: QrCode,
      color: 'blue',
    },
    {
      label: 'Lanzamientos AR (30d)',
      value: metrics?.arLaunchesLast30d ?? 0,
      icon: BarChart3,
      color: 'purple',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {user && !user.emailVerified && <EmailVerificationBanner />}
      {tenantId && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MenuLinkBanner tenantId={tenantId} />
          <StaffLinkBanner tenantId={tenantId} />
        </div>
      )}
      {tenantId && <FreePlanUpgradeBanner tenantId={tenantId} />}
      {lowStockAlerts.length > 0 && <LowStockAlert alerts={lowStockAlerts} />}

      <PageHeader eyebrow={greeting()} title={tenant?.name ?? 'Dashboard'} />

      {/* Selector de Rango de Fechas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {(['today', 'week', 'month'] as const).map((preset) => (
          <button
            key={preset}
            onClick={() => setDateRange(preset)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
              dateRange === preset
                ? 'bg-zinc-800 text-white shadow-md'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
            }`}
          >
            {preset === 'today' ? 'Hoy' : preset === 'week' ? 'Esta Semana' : 'Este Mes'}
          </button>
        ))}
      </div>

      {/* Métricas por Rango de Fecha */}
      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {rangeCards.map((card) => (
            <MetricCard key={card.label} data={card} isLoading={rangeMetrics.isLoading} />
          ))}
        </div>
      </section>

      {/* Métricas Generales del Restaurante */}
      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">Estado General</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {metricCards.map((card) => (
            <MetricCard key={card.label} data={card} isLoading={metricsLoading} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QuickActions />
        <ActivityFeed events={activityItems} isLoading={activityLoading} error={null} />
      </div>
    </div>
  )
}
