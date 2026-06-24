import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { ShoppingBag, UtensilsCrossed, Megaphone, QrCode, ExternalLink, LogOut, Menu as MenuIcon, X, TabletSmartphone } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { auth } from '@infrastructure/firebase/auth'
import { ROUTES } from '@shared/constants/routes'
import { cn } from '@shared/utils/cn'

const STAFF_NAV = [
  { seg: ROUTES.staff.segments.waiter,       label: 'Tomar Pedido',      Icon: TabletSmartphone },
  { seg: ROUTES.staff.segments.orders,       label: 'Pedidos',           Icon: ShoppingBag },
  { seg: ROUTES.staff.segments.availability, label: 'Disponibilidad',    Icon: UtensilsCrossed },
  { seg: ROUTES.staff.segments.promos,       label: 'Promos y Horarios', Icon: Megaphone },
  { seg: ROUTES.staff.segments.tables,       label: 'Mesas y QR',        Icon: QrCode },
] as const

/**
 * Layout del panel de trabajadores — separado del admin del dueño.
 * Sidebar mínima con solo las secciones operativas. El acceso real lo controla
 * el rol `staff` en `members` + las reglas de Firestore (no este layout).
 */
export function StaffLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const { tenant, tenantId } = useTenantContext()
  const navigate = useNavigate()

  async function handleSignOut(): Promise<void> {
    if (auth) await signOut(auth)
    // Vuelve a la pantalla de PIN de este menú.
    navigate(tenantId ? `/${tenantId}/staff` : ROUTES.auth.login, { replace: true })
  }

  return (
    <div className="flex h-svh overflow-hidden" style={{ background: '#faf9f7' }}>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-black/[0.06] bg-white transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-black/[0.06]">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-surface-800">{tenant?.name ?? 'Restaurante'}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Panel staff</span>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} className="lg:hidden text-surface-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
          {STAFF_NAV.map(({ seg, label, Icon }) => (
            <NavLink
              key={seg}
              to={`/${tenantId}/staff/${seg}`}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-75 hover:text-surface-800',
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-black/[0.06] p-3 flex flex-col gap-1">
          {tenantId && (
            <a
              href={`/${tenantId}/menu`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-surface-600 hover:bg-surface-75 hover:text-surface-800 transition-colors"
            >
              <ExternalLink size={17} />
              Ver menú
            </a>
          )}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-black/[0.06] bg-white px-4 py-3 lg:hidden">
          <button type="button" aria-label="Abrir menú" onClick={() => setIsOpen(true)} className="text-surface-600">
            <MenuIcon size={20} />
          </button>
          <span className="text-sm font-black text-surface-800">{tenant?.name ?? 'Panel staff'}</span>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-5 lg:p-7">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
