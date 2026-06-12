import { useState } from 'react'
import { Outlet, useLocation, useMatch, Navigate } from 'react-router-dom'
import { Sidebar, Topbar } from '@features/dashboard'
import { OnboardingWizard, useOnboardingState } from '@features/onboarding'
import { useTenantContext } from '@app/providers/TenantProvider'
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

  const { tenant, tenantId, role } = useTenantContext()
  const { shouldShow: shouldShowOnboarding } = useOnboardingState(tenant)

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

  return (
    <div className="flex h-svh overflow-hidden" style={{ background: '#faf9f7' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          title={pageTitle}
          onMenuToggle={handleMenuToggle}
        />

        <main className={`flex-1 min-h-0 ${isAppearancePage ? 'p-0 flex flex-col' : 'overflow-y-auto p-5 lg:p-7'}`}>
          <div className={isAppearancePage ? 'w-full h-full flex flex-col min-h-0' : 'mx-auto max-w-6xl'}>
            <Outlet />
          </div>
        </main>
      </div>

      {shouldShowOnboarding && <OnboardingWizard />}
    </div>
  )
}
