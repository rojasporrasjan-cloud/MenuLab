import { useParams, Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft, ExternalLink, Mail, Fingerprint, Calendar, Clock, Globe,
  LayoutTemplate, CheckCircle2, PauseCircle, PlayCircle, Loader2, AlertCircle, Store, LogIn,
} from 'lucide-react'
import { usePlatformTenant, useUpdateTenantSubscription, setImpersonatedTenantId } from '@features/platform-admin'
import { ROUTES } from '@shared/constants/routes'
import type { TenantPlan, TenantStatus } from '@core/domain/entities/Tenant'

const PLANS: readonly TenantPlan[] = ['free', 'starter', 'pro', 'enterprise']

const PLAN_LABEL: Record<TenantPlan, string> = {
  free: 'Free', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise',
}

const STATUS_META: Record<TenantStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Activo',     color: '#4ade80', bg: 'rgba(34,197,94,0.15)' },
  trial:     { label: 'Trial',      color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  suspended: { label: 'Suspendido', color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
}

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function InfoCard({ icon: Icon, label, value }: { readonly icon: LucideIcon; readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: '#18181b', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon size={13} style={{ color: '#71717a' }} />
        <p className="text-xs" style={{ color: '#71717a' }}>{label}</p>
      </div>
      <p className="break-words text-sm font-medium text-white">{value}</p>
    </div>
  )
}

export default function TenantDetailPage() {
  const { tenantId = '' } = useParams()
  const { data: tenant, isLoading, isError } = usePlatformTenant(tenantId)
  const updateSub = useUpdateTenantSubscription(tenantId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin" size={24} style={{ color: '#52525b' }} />
      </div>
    )
  }

  if (isError || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle size={28} style={{ color: '#f87171' }} />
        <p className="text-sm" style={{ color: '#a1a1aa' }}>No se pudo cargar este restaurante.</p>
        <Link to={ROUTES.platformAdmin.tenants} className="text-xs underline" style={{ color: '#71717a' }}>
          Volver a la lista
        </Link>
      </div>
    )
  }

  const status = STATUS_META[tenant.status]

  function setPlan(plan: TenantPlan): void {
    if (!tenant || plan === tenant.plan || updateSub.isPending) return
    updateSub.mutate({ plan })
  }

  function setStatus(next: TenantStatus, confirmMsg?: string): void {
    if (updateSub.isPending) return
    if (confirmMsg && !window.confirm(confirmMsg)) return
    updateSub.mutate({ status: next })
  }

  function enterPanel(): void {
    if (!tenant) return
    setImpersonatedTenantId(tenant.id)
    window.location.href = ROUTES.admin.dashboard
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link
        to={ROUTES.platformAdmin.tenants}
        className="inline-flex items-center gap-1.5 text-xs transition-colors hover:text-white"
        style={{ color: '#71717a' }}
      >
        <ArrowLeft size={14} /> Todos los clientes
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
            style={{ background: tenant.branding.primaryColor + '22', color: tenant.branding.primaryColor }}
          >
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight text-white">{tenant.name}</h1>
            <p className="text-xs" style={{ color: '#52525b' }}>/{tenant.slug}</p>
          </div>
          <span
            className="ml-1 rounded px-2 py-0.5 text-xs font-medium"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={enterPanel}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            style={{ background: 'rgba(245,181,32,0.15)', color: '#f5b520' }}
          >
            <LogIn size={13} /> Entrar al panel
          </button>
          <a
            href={`/${tenant.slug}/menu`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#d4d4d8' }}
          >
            <ExternalLink size={13} /> Ver menú público
          </a>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard icon={Mail}           label="Email del dueño"  value={tenant.ownerEmail ?? 'No registrado (cuenta previa)'} />
        <InfoCard icon={Fingerprint}    label="UID del dueño"    value={tenant.ownerId ?? '—'} />
        <InfoCard icon={Store}          label="Plan actual"      value={PLAN_LABEL[tenant.plan]} />
        <InfoCard icon={Calendar}       label="Registrado"       value={`${formatDate(tenant.createdAt)} · hace ${daysSince(tenant.createdAt)} días`} />
        <InfoCard icon={Clock}          label="Última actividad" value={formatDate(tenant.updatedAt)} />
        <InfoCard icon={CheckCircle2}   label="Onboarding"       value={tenant.onboardingCompletedAt ? `Completado ${formatDate(tenant.onboardingCompletedAt)}` : 'Pendiente'} />
        <InfoCard icon={LayoutTemplate} label="Plantilla"        value={tenant.templateId} />
        <InfoCard icon={Globe}          label="Locale / zona"    value={`${tenant.locale} · ${tenant.timezone}`} />
      </div>

      {/* Subscription management */}
      <div className="rounded-xl border p-5" style={{ background: '#18181b', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Suscripción</h2>
          {updateSub.isPending && (
            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: '#71717a' }}>
              <Loader2 size={12} className="animate-spin" /> Guardando…
            </span>
          )}
          {updateSub.isError && (
            <span className="text-xs" style={{ color: '#f87171' }}>Error al guardar — ¿reglas desplegadas?</span>
          )}
        </div>

        {/* Plan selector */}
        <p className="mb-2 text-xs" style={{ color: '#71717a' }}>Plan</p>
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan === tenant.plan
            return (
              <button
                key={plan}
                type="button"
                onClick={() => setPlan(plan)}
                disabled={updateSub.isPending || isCurrent}
                className="rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-default"
                style={
                  isCurrent
                    ? { background: 'rgba(245,181,32,0.15)', borderColor: 'rgba(245,181,32,0.4)', color: '#f5b520' }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#d4d4d8' }
                }
              >
                {PLAN_LABEL[plan]}
                {isCurrent && ' ✓'}
              </button>
            )
          })}
        </div>

        {/* Status actions */}
        <p className="mb-2 text-xs" style={{ color: '#71717a' }}>Estado de la suscripción</p>
        <div className="flex flex-wrap gap-2">
          {tenant.status !== 'active' && (
            <button
              type="button"
              onClick={() => setStatus('active')}
              disabled={updateSub.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}
            >
              <PlayCircle size={15} /> Reactivar / renovar
            </button>
          )}
          {tenant.status !== 'suspended' && (
            <button
              type="button"
              onClick={() => setStatus('suspended', `¿Suspender la suscripción de "${tenant.name}"? Su menú seguirá visible, pero queda marcado como cancelado.`)}
              disabled={updateSub.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
            >
              <PauseCircle size={15} /> Suspender / cancelar
            </button>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed" style={{ color: '#52525b' }}>
          Cambiar el plan o el estado actualiza el restaurante al instante. El cobro
          automático (Stripe/SINPE) se conecta aparte — por ahora esto es gestión manual.
        </p>
      </div>
    </div>
  )
}
