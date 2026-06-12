import { Outlet, Link } from 'react-router-dom'
import { UtensilsCrossed, LogOut } from 'lucide-react'

import { useTenantContext } from '@app/providers/TenantProvider'
import { useNow } from '@shared/hooks/useNow'
import { ROUTES } from '@shared/constants/routes'
import { COPY } from '@shared/copy/ui.copy'

const POS_BG = '#0c0c0b'

function formatClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * Layout fullscreen oscuro para el comandero (tablet de salón).
 * Sin sidebar: logo, nombre, reloj y salida al panel — mismo patrón que KDSLayout.
 */
export function POSLayout() {
  const { tenant } = useTenantContext()
  const now = useNow()

  return (
    <div className="flex h-svh flex-col overflow-hidden" style={{ background: POS_BG }}>
      <header
        className="flex shrink-0 items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          {tenant?.branding.logoUrl ? (
            <img
              src={tenant.branding.logoUrl}
              alt={tenant.name}
              className="h-9 w-9 rounded-lg object-contain"
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <UtensilsCrossed size={17} className="text-white" />
            </div>
          )}
          <div>
            <p className="text-[14px] font-black leading-tight text-white">
              {tenant?.name ?? COPY.pos.title}
            </p>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {COPY.pos.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <time className="text-2xl font-black tabular-nums text-white" aria-label="Hora actual">
            {formatClock(now)}
          </time>
          <Link
            to={ROUTES.admin.dashboard}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <LogOut size={13} />
            {COPY.kds.exit}
          </Link>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden p-4">
        <Outlet />
      </main>
    </div>
  )
}
