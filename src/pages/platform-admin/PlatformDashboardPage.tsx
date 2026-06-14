import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Store, Users, CircleDollarSign, TrendingUp, CheckCircle2, PauseCircle, ArrowUpRight, Clock,
} from 'lucide-react'
import { usePlatformTenants } from '@features/platform-admin'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { ROUTES } from '@shared/constants/routes'
import type { Tenant, TenantPlan } from '@core/domain/entities/Tenant'

const PLAN_LABEL: Record<TenantPlan, string> = {
  free: 'Free', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise',
}

// Precio mensual por plan (CRC). Mantener en sync con marketing PLANS.
// enterprise = "a convenir" → no suma al MRR estimado.
const PLAN_PRICE_CRC: Record<TenantPlan, number> = {
  free: 0, starter: 0, pro: 9900, enterprise: 0,
}

const PLAN_COLOR: Record<TenantPlan, string> = {
  free: '#a1a1aa', starter: '#60a5fa', pro: '#f5b520', enterprise: '#c084fc',
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function withinDays(date: Date, days: number): boolean {
  return Date.now() - date.getTime() <= days * MS_PER_DAY
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
}

// ── KPI card ────────────────────────────────────────────────────────────────
function Kpi({ icon: Icon, label, value, sub, accent = '#ffffff' }: {
  readonly icon: LucideIcon
  readonly label: string
  readonly value: string
  readonly sub?: string
  readonly accent?: string
}) {
  return (
    <div className="rounded-xl border p-5" style={{ background: '#18181b', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: accent + '1a' }}>
        <Icon size={17} style={{ color: accent }} />
      </div>
      <p className="text-[26px] font-bold leading-none tracking-tight" style={{ color: '#fff' }}>{value}</p>
      <p className="mt-1.5 text-xs" style={{ color: '#71717a' }}>{label}</p>
      {sub && <p className="mt-0.5 text-[11px]" style={{ color: '#52525b' }}>{sub}</p>}
    </div>
  )
}

export default function PlatformDashboardPage() {
  const { data, isLoading, isError } = usePlatformTenants()
  const tenants: Tenant[] = data ?? []

  const total     = tenants.length
  const new7      = tenants.filter((t) => withinDays(t.createdAt, 7)).length
  const new30     = tenants.filter((t) => withinDays(t.createdAt, 30)).length
  const active    = tenants.filter((t) => t.status === 'active').length
  const suspended = tenants.filter((t) => t.status === 'suspended').length
  const mrr       = tenants
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + PLAN_PRICE_CRC[t.plan], 0)

  const byPlan: Record<TenantPlan, number> = { free: 0, starter: 0, pro: 0, enterprise: 0 }
  tenants.forEach((t) => { byPlan[t.plan] += 1 })
  const plans: TenantPlan[] = ['free', 'starter', 'pro', 'enterprise']

  const recent = tenants.slice(0, 6) // getAll ya viene ordenado por createdAt desc

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#f5b520', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="py-24 text-center text-sm" style={{ color: '#f87171' }}>
        Error al cargar los datos. ¿Reglas de Firestore desplegadas?
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Resumen del negocio</h1>
        <p className="mt-1 text-sm" style={{ color: '#71717a' }}>
          Cómo va tu plataforma: registros, planes e ingresos.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={CircleDollarSign} label="Ingresos mensuales (MRR)" value={formatCurrency(mrr, 'CRC')} sub="Estimado · solo activos" accent="#f5b520" />
        <Kpi icon={Store}            label="Restaurantes totales"     value={String(total)} sub={`${active} activos · ${suspended} suspendidos`} accent="#4ade80" />
        <Kpi icon={Users}            label="Nuevos esta semana"        value={String(new7)} sub={`${new30} en los últimos 30 días`} accent="#60a5fa" />
        <Kpi icon={TrendingUp}       label="Clientes de pago"          value={String(byPlan.pro + byPlan.starter + byPlan.enterprise)} sub={`${byPlan.free} en plan gratis`} accent="#c084fc" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Plan distribution */}
        <div className="rounded-xl border p-5" style={{ background: '#18181b', borderColor: 'rgba(255,255,255,0.07)' }}>
          <h2 className="mb-4 text-sm font-semibold text-white">Distribución por plan</h2>
          <div className="flex flex-col gap-3.5">
            {plans.map((plan) => {
              const count = byPlan[plan]
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={plan}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: '#d4d4d8' }}>{PLAN_LABEL[plan]}</span>
                    <span style={{ color: '#71717a' }}>{count} · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PLAN_COLOR[plan] }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex items-center gap-4 border-t pt-4 text-xs" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="flex items-center gap-1.5" style={{ color: '#4ade80' }}><CheckCircle2 size={13} /> {active} activos</span>
            <span className="flex items-center gap-1.5" style={{ color: '#f87171' }}><PauseCircle size={13} /> {suspended} suspendidos</span>
          </div>
        </div>

        {/* Recent signups */}
        <div className="rounded-xl border p-5" style={{ background: '#18181b', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Registros recientes</h2>
            <Link to={ROUTES.platformAdmin.tenants} className="inline-flex items-center gap-1 text-xs transition-colors hover:text-white" style={{ color: '#71717a' }}>
              Ver todos <ArrowUpRight size={12} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: '#52525b' }}>Aún no hay registros.</p>
          ) : (
            <div className="flex flex-col">
              {recent.map((t) => (
                <Link
                  key={t.id}
                  to={ROUTES.platformAdmin.tenant(t.id)}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ background: t.branding.primaryColor + '22', color: t.branding.primaryColor }}>
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{t.name}</p>
                    <p className="truncate text-[11px]" style={{ color: '#52525b' }}>{t.ownerEmail ?? `/${t.slug}`}</p>
                  </div>
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: PLAN_COLOR[t.plan] + '22', color: PLAN_COLOR[t.plan] }}>
                    {PLAN_LABEL[t.plan]}
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-[11px] sm:flex" style={{ color: '#52525b' }}>
                    <Clock size={11} /> {formatDate(t.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
