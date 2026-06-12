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
  useTodayMetrics,
} from '@features/dashboard'
import { useLowStockAlerts, LowStockAlert } from '@features/inventory'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { greeting } from '@shared/utils/datetime'
import { TenantProvisioningService } from '@infrastructure/services/TenantProvisioningService'
import { TEMPLATE_DEFAULT_BRANDING, DEFAULT_TEMPLATE_ID, TEMPLATE_DEFINITIONS } from '@features/templates'
import { Spinner } from '@shared/ui/components/Spinner'
import { Button } from '@shared/ui/components/Button'
import type { MetricCardData } from '@features/dashboard'

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
    <div
      className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4"
      style={{
        background: 'linear-gradient(135deg, #fef9ee 0%, #fef3c7 100%)',
        border: '1px solid rgba(217,119,6,0.25)',
      }}
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'rgba(217,119,6,0.12)' }}
      >
        <QrCode size={18} style={{ color: '#b45309' }} />
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#92400e' }}>
          Tu link del menú
        </p>
        <p
          className="truncate font-mono text-[13px] font-semibold"
          style={{ color: '#1c1409' }}
        >
          {menuUrl}
        </p>
        <p className="text-[11px]" style={{ color: '#a16207' }}>
          Compártelo con tus clientes o imprimilo en un QR
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all active:scale-95"
          style={{
            background: copied ? '#d1fae5' : '#fff',
            border: `1px solid ${copied ? '#6ee7b7' : 'rgba(217,119,6,0.3)'}`,
            color: copied ? '#065f46' : '#92400e',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={`/${tenantId}/menu`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all active:scale-95"
          style={{
            background: '#b45309',
            color: '#fff',
          }}
        >
          <ExternalLink size={13} />
          Ver menú
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
                const isSelected = templateId === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTemplateId(id as any)}
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

export default function DashboardPage() {
  const { tenantId, tenant, isLoading: tenantLoading } = useTenantContext()
  const { user } = useAuth()

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(tenantId)
  const { events: activityItems, isLoading: activityLoading } = useActivityFeed(tenantId)
  const today = useTodayMetrics(tenantId ?? '')
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

  // Métricas del día (arriba) — pedidos hoy con flecha vs ayer.
  const todayCards: MetricCardData[] = [
    {
      label: 'Pedidos hoy',
      value: today.ordersToday,
      icon: ShoppingBag,
      color: 'brand',
      trend: {
        value: Math.round(today.ordersTrendPercent),
        isPositive: today.ordersTrendPositive,
      },
    },
    {
      label: 'Ingresos hoy',
      value: formatCurrency(today.revenueToday, today.currency),
      icon: Wallet,
      color: 'green',
    },
    {
      label: 'Ticket promedio',
      value: formatCurrency(today.averageTicket, today.currency),
      icon: Receipt,
      color: 'blue',
    },
    {
      label: 'Reservas pendientes',
      value: today.pendingReservations,
      icon: CalendarCheck,
      color: 'purple',
    },
  ]

  const metricCards: MetricCardData[] = [
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
      {tenantId && <MenuLinkBanner tenantId={tenantId} />}
      {tenantId && <FreePlanUpgradeBanner tenantId={tenantId} />}
      {lowStockAlerts.length > 0 && <LowStockAlert alerts={lowStockAlerts} />}

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          {greeting()}
        </p>
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-zinc-900">
          {tenant?.name ?? 'Dashboard'}
        </h1>
      </div>

      {/* Métricas del día */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {todayCards.map((card) => (
          <MetricCard key={card.label} data={card} isLoading={today.isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metricCards.map((card) => (
          <MetricCard key={card.label} data={card} isLoading={metricsLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QuickActions />
        <ActivityFeed events={activityItems} isLoading={activityLoading} error={null} />
      </div>
    </div>
  )
}
