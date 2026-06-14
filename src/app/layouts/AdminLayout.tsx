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

  // El staff no entra al admin del dueño — se le manda a su panel.
  if (role === 'staff' && tenantId) {
    return <Navigate to={ROUTES.staff.home(tenantId)} replace />
  }

  // Superadmin sin restaurante propio y sin "ver como" → su panel de plataforma
  // (evita mandarlo al asistente de creación de restaurante).
  if (adminUser && !isImpersonating && !isLoading && !tenant) {
    return <Navigate to={ROUTES.platformAdmin.root} replace />
  }

  return (
    <div className="flex h-svh overflow-hidden print:h-auto print:overflow-visible print:bg-white" style={{ background: '#faf9f7' }}>
      <div className="print:hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
        />
      </div>

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
        <div className="print:hidden">
          <Topbar
            title={pageTitle}
            onMenuToggle={handleMenuToggle}
          />
        </div>

        <main className={`flex-1 min-h-0 ${isAppearancePage ? 'p-0 flex flex-col' : 'overflow-y-auto p-5 lg:p-7'} print:overflow-visible print:p-0`}>
          <div className={isAppearancePage ? 'w-full h-full flex flex-col min-h-0 print:h-auto print:min-h-0' : 'mx-auto max-w-6xl'}>
            <Outlet />
          </div>
        </main>
      </div>

      {shouldShowOnboarding && <OnboardingWizard />}
    </div>
  )
}
