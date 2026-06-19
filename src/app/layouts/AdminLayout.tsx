import { useState } from 'react'
import { Outlet, useLocation, useMatch, Navigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { Sidebar, Topbar } from '@features/dashboard'
import { OnboardingWizard, useOnboardingState } from '@features/onboarding'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useAuthContext } from '@app/providers/AuthProvider'
import { isPlatformAdminUser } from '@shared/config/platformAdmin'
import { getImpersonatedTenantId, clearImpersonatedTenantId } from '@features/platform-admin'
import { ROUTES } from '@shared/constants/routes'
import { useTerminalMode } from '@shared/hooks/useTerminalMode'

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.admin.dashboard]:    'Dashboard',
  [ROUTES.admin.menu.list]:    'Menú',
  [ROUTES.admin.dishes.list]:  'Platos',
  [ROUTES.admin.dishes.new]:   'Nuevo plato',
  [ROUTES.admin.qr]:           'Mesas & QR',
  [ROUTES.admin.analytics]:    'Analíticas',
  [ROUTES.admin.settings]:     'Configuración',
  [ROUTES.admin.appearance]:   'Apariencia',
  [ROUTES.admin.orders]:       'Pedidos',
  [ROUTES.admin.pos]:          'POS',
  [ROUTES.admin.kds]:          'Cocina',
  [ROUTES.admin.cash]:         'Caja',
  [ROUTES.admin.reservations]: 'Reservaciones',
  [ROUTES.admin.plan]:         'Mi Plan',
  [ROUTES.admin.loyalty]:      'Lealtad',
  [ROUTES.admin.customers]:    'Clientes',
  [ROUTES.admin.inventory]:    'Inventario',
}

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const location    = useLocation()
  const isDishEditor = useMatch(ROUTES.admin.dishes.editor)

  const { tenant, tenantId, role, isLoading } = useTenantContext()
  const { firebaseUser } = useAuthContext()
  const { shouldShow: shouldShowOnboarding } = useOnboardingState(tenant)

  const adminUser = isPlatformAdminUser(
    firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null,
  )
  const isImpersonating = adminUser && getImpersonatedTenantId() !== null

  const { mode: terminalMode } = useTerminalMode()
  const isTerminalActive = terminalMode !== 'none'

  function handleExitImpersonation(): void {
    clearImpersonatedTenantId()
    window.location.href = ROUTES.platformAdmin.tenants
  }

  const pageTitle =
    isDishEditor
      ? 'Editar plato'
      : PAGE_TITLES[location.pathname] ?? 'Admin'

  const handleMenuToggle = () => {
    if (window.innerWidth >= 1024) {
      setIsSidebarCollapsed((prev) => !prev)
    } else {
      setIsSidebarOpen((prev) => !prev)
    }
  }

  const isAppearancePage = location.pathname === ROUTES.admin.appearance
  // POS y Cocina: área de trabajo oscura a sangre completa (sin el contenedor
  // claro centrado). El sidebar sigue visible salvo en modo terminal (kiosko).
  const isTerminalPage = location.pathname === ROUTES.admin.pos || location.pathname === ROUTES.admin.kds

  // El staff no entra al admin del dueño — se le manda a su panel.
  if (role === 'staff' && tenantId) {
    return <Navigate to={ROUTES.staff.home(tenantId)} replace />
  }

  // Superadmin sin restaurante propio y sin "ver como" → su panel de plataforma
  if (adminUser && !isImpersonating && !isLoading && !tenant) {
    return <Navigate to={ROUTES.platformAdmin.root} replace />
  }

  // Redirecciones forzosas en Modo Terminal
  if (terminalMode === 'pos' && location.pathname !== ROUTES.admin.pos) {
    return <Navigate to={ROUTES.admin.pos} replace />
  }
  if (terminalMode === 'kds' && location.pathname !== ROUTES.admin.kds) {
    return <Navigate to={ROUTES.admin.kds} replace />
  }
  if (terminalMode === 'cash' && location.pathname !== ROUTES.admin.cash) {
    return <Navigate to={ROUTES.admin.cash} replace />
  }

  return (
    <div className="flex h-svh overflow-hidden print:h-auto print:overflow-visible print:bg-white" style={{ background: '#faf9f7' }}>
      {!isTerminalActive && (
        <div className="print:hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
        {isImpersonating && (
          <div className="flex items-center justify-between gap-3 bg-amber-400 px-4 py-2 text-[13px] font-semibold text-amber-950 print:hidden">
            <span className="flex min-w-0 items-center gap-2">
              <Eye size={14} className="shrink-0" />
              <span className="truncate">
                Viendo <strong>{tenant?.name ?? '…'}</strong> como superadmin · modo lectura
              </span>
            </span>
            <button
              type="button"
              onClick={handleExitImpersonation}
              className="shrink-0 rounded-md bg-amber-950/15 px-2.5 py-1 text-xs font-bold transition-colors hover:bg-amber-950/25"
            >
              Salir
            </button>
          </div>
        )}
        
        {!isTerminalActive && (
          <div className="print:hidden">
            <Topbar
              title={pageTitle}
              onMenuToggle={handleMenuToggle}
            />
          </div>
        )}

        <main
          className={`flex-1 min-h-0 print:overflow-visible print:p-0 ${
            isAppearancePage
              ? 'p-0 flex flex-col'
              : isTerminalPage
                ? 'overflow-hidden p-4 flex flex-col'
                : 'overflow-y-auto p-5 lg:p-7'
          }`}
          style={isTerminalPage ? { background: '#0c0c0b' } : undefined}
        >
          <div className={isAppearancePage || isTerminalPage || isTerminalActive ? 'w-full h-full flex flex-col min-h-0 print:h-auto print:min-h-0' : 'mx-auto max-w-6xl'}>
            <Outlet />
          </div>
        </main>
      </div>

      {shouldShowOnboarding && <OnboardingWizard />}
    </div>
  )
}
