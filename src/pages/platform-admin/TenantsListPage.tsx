import { useNavigate } from 'react-router-dom'
import { usePlatformTenants } from '@features/platform-admin'
import { ROUTES } from '@shared/constants/routes'
import type { Tenant, TenantPlan, TenantStatus } from '@core/domain/entities/Tenant'

// ── Badge helpers ─────────────────────────────────────────────────────────────

interface BadgeConfig {
  label: string
  bg: string
  color: string
}

const PLAN_BADGE: Record<TenantPlan, BadgeConfig> = {
  free:       { label: 'Free',       bg: 'rgba(113,113,122,0.2)',   color: '#a1a1aa' },
  starter:    { label: 'Starter',    bg: 'rgba(59,130,246,0.15)',   color: '#60a5fa' },
  pro:        { label: 'Pro',        bg: 'rgba(168,85,247,0.15)',   color: '#c084fc' },
  enterprise: { label: 'Enterprise', bg: 'rgba(234,179,8,0.15)',    color: '#facc15' },
}

const STATUS_BADGE: Record<TenantStatus, BadgeConfig> = {
  active:    { label: 'Activo',     bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
  trial:     { label: 'Trial',      bg: 'rgba(251,146,60,0.15)', color: '#fb923c' },
  suspended: { label: 'Suspendido', bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
}

function Badge({ config }: { readonly config: BadgeConfig }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  readonly label: string
  readonly value: number
  readonly accent: string
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: '#18181b', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <p className="text-xs mb-1" style={{ color: '#71717a' }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color: accent }}>{value}</p>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function DaysAgo({ date }: { readonly date: Date }) {
  const days = daysSince(date)
  return (
    <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>
      {days === 0 ? 'Hoy' : `Hace ${days} día${days !== 1 ? 's' : ''}`}
    </p>
  )
}

// ── Table row ─────────────────────────────────────────────────────────────────

function TenantRow({ tenant }: { readonly tenant: Tenant }) {
  const navigate = useNavigate()
  return (
    <tr
      onClick={() => navigate(ROUTES.platformAdmin.tenant(tenant.id))}
      className="cursor-pointer border-b transition-colors hover:bg-white/[0.025]"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <td className="py-3.5 pr-4 pl-5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: tenant.branding.primaryColor + '22',
              color: tenant.branding.primaryColor,
            }}
          >
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white leading-tight">{tenant.name}</p>
            <p className="truncate text-xs mt-0.5" style={{ color: '#52525b' }}>
              {tenant.ownerEmail ?? `/${tenant.slug}`}
            </p>
          </div>
        </div>
      </td>

      <td className="py-3.5 pr-4">
        <Badge config={PLAN_BADGE[tenant.plan]} />
      </td>

      <td className="py-3.5 pr-4">
        <Badge config={STATUS_BADGE[tenant.status]} />
      </td>

      <td className="py-3.5 pr-4">
        <span className="text-xs" style={{ color: '#71717a' }}>{tenant.templateId}</span>
      </td>

      <td className="py-3.5 pr-4">
        <p className="text-sm" style={{ color: '#a1a1aa' }}>{formatDate(tenant.createdAt)}</p>
        <DaysAgo date={tenant.createdAt} />
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TenantsListPage() {
  const { data: tenants, isLoading, isError } = usePlatformTenants()

  const total    = tenants?.length ?? 0
  const active   = tenants?.filter((t) => t.status === 'active').length ?? 0
  const trial    = tenants?.filter((t) => t.status === 'trial').length ?? 0
  const freePlan = tenants?.filter((t) => t.plan === 'free').length ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Clientes registrados</h1>
        <p className="text-sm mt-1" style={{ color: '#71717a' }}>
          Todos los restaurantes registrados en la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total"     value={total}    accent="#ffffff" />
        <StatCard label="Activos"   value={active}   accent="#4ade80" />
        <StatCard label="En trial"  value={trial}    accent="#fb923c" />
        <StatCard label="Plan free" value={freePlan} accent="#a1a1aa" />
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: '#18181b', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm" style={{ color: '#f87171' }}>
              Error al cargar los clientes.
            </p>
            <p className="text-xs" style={{ color: '#52525b' }}>
              Verifica que las reglas de Firestore permiten leer la colección{' '}
              <code className="font-mono">tenants</code> para tu UID.
            </p>
          </div>
        )}

        {!isLoading && !isError && total === 0 && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm" style={{ color: '#52525b' }}>
              Ningún cliente registrado aún.
            </p>
          </div>
        )}

        {!isLoading && !isError && total > 0 && (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Restaurante', 'Plan', 'Estado', 'Plantilla', 'Registrado'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 pr-4 text-xs font-medium first:pl-5"
                    style={{ color: '#52525b' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tenants ?? []).map((tenant) => (
                <TenantRow key={tenant.id} tenant={tenant} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
