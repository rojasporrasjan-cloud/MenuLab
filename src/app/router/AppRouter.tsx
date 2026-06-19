import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@shared/constants/routes'

import { AuthGuard } from './guards/AuthGuard'
import { StaffAuthGate } from './guards/StaffAuthGate'
import { PlatformAdminGuard } from './guards/PlatformAdminGuard'
import RootLayout from '@app/layouts/RootLayout'
import { AdminLayout } from '@app/layouts/AdminLayout'
import { StaffLayout } from '@app/layouts/StaffLayout'
import { KDSLayout } from '@app/layouts/KDSLayout'
import { POSLayout } from '@app/layouts/POSLayout'
import { PublicLayout } from '@app/layouts/PublicLayout'
import { MarketingLayout } from '@app/layouts/MarketingLayout'
import { PlatformAdminLayout } from '@app/layouts/PlatformAdminLayout'
import { RequirePin } from '@app/router/RequirePin'

import {
  LandingPage,
  TemplatesGalleryPage,
  QuotePage,
  MenuPage,
  NotFoundPage,
  DashboardPage,
  EditorPage,
  MenuManagerPage,
  DishListPage,
  DishEditorPage,
  QRManagerPage,
  TemplatesPage,
  AppearancePage,
  AnalyticsPage,
  SettingsPage,
  OrdersPage,
  KDSPage,
  PublicReservationsPage,
  AdminReservationsPage,
  PlanPage,
  LoyaltyPage,
  CustomersPage,
  InventoryPage,
  POSPage,
  CashRegisterPage,
  LoginPage,
  RegisterPage,
  PlatformDashboardPage,
  TenantsListPage,
  TenantDetailPage,
  StaffAvailabilityPage,
  StaffPromosPage,
} from './routes'

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<RootLayout />}>

            {/* ── Marketing routes (public acquisition funnel) ── */}
            <Route element={<MarketingLayout />}>
              <Route path={ROUTES.marketing.landing} element={<LandingPage />} />
              <Route path={ROUTES.marketing.templates} element={<TemplatesGalleryPage />} />
              <Route path={ROUTES.marketing.quote} element={<QuotePage />} />
            </Route>

            {/* ── Public routes (customer QR scan) ── */}
            <Route element={<PublicLayout />}>
              <Route path={ROUTES.public.menu} element={<MenuPage />} />
              <Route path={ROUTES.public.dish} element={<MenuPage />} />
              <Route path={ROUTES.public.reservations} element={<PublicReservationsPage />} />
            </Route>

            {/* ── Staff panel por menú (trabajadores entran con PIN) ── */}
            <Route path={ROUTES.staff.base} element={<StaffAuthGate />}>
              <Route element={<StaffLayout />}>
                <Route index element={<Navigate to={ROUTES.staff.segments.orders} replace />} />
                <Route path={ROUTES.staff.segments.orders} element={<OrdersPage />} />
                <Route path={ROUTES.staff.segments.availability} element={<StaffAvailabilityPage />} />
                <Route path={ROUTES.staff.segments.promos} element={<StaffPromosPage />} />
                <Route path={ROUTES.staff.segments.tables} element={<QRManagerPage />} />
              </Route>
            </Route>

            {/* ── Auth routes ── */}
            <Route path={ROUTES.auth.login} element={<LoginPage />} />
            <Route path={ROUTES.auth.register} element={<RegisterPage />} />

            {/* ── Protected admin routes ── */}
            <Route element={<AuthGuard />}>

              {/* Editor is full-screen standalone — has its own topbar/left-rail, no admin shell */}
              <Route path={ROUTES.admin.editor} element={<EditorPage />} />

              {/* KDS — pantalla fullscreen para tablet de cocina, sin admin shell */}
              <Route element={<RequirePin moduleId="kds"><KDSLayout /></RequirePin>}>
                <Route path={ROUTES.admin.kds} element={<KDSPage />} />
              </Route>

              {/* POS — comandero fullscreen para tablet de salón, sin admin shell */}
              <Route element={<RequirePin moduleId="orders"><POSLayout /></RequirePin>}>
                <Route path={ROUTES.admin.pos} element={<POSPage />} />
              </Route>

              <Route element={<AdminLayout />}>
                <Route path={ROUTES.admin.root} element={<Navigate to={ROUTES.admin.dashboard} replace />} />
                <Route path={ROUTES.admin.dashboard} element={<RequirePin moduleId="dashboard"><DashboardPage /></RequirePin>} />
                <Route path={ROUTES.admin.menu.list} element={<RequirePin moduleId="menu"><MenuManagerPage /></RequirePin>} />
                <Route path={ROUTES.admin.dishes.list} element={<RequirePin moduleId="dishes"><DishListPage /></RequirePin>} />
                <Route path={ROUTES.admin.dishes.new} element={<RequirePin moduleId="dishes"><DishEditorPage /></RequirePin>} />
                <Route path={ROUTES.admin.dishes.editor} element={<RequirePin moduleId="dishes"><DishEditorPage /></RequirePin>} />
                <Route path={ROUTES.admin.qr} element={<RequirePin moduleId="qr"><QRManagerPage /></RequirePin>} />
                <Route path={ROUTES.admin.templates} element={<RequirePin moduleId="templates"><TemplatesPage /></RequirePin>} />
                <Route path={ROUTES.admin.appearance} element={<RequirePin moduleId="appearance"><AppearancePage /></RequirePin>} />
                <Route path={ROUTES.admin.analytics} element={<RequirePin moduleId="analytics"><AnalyticsPage /></RequirePin>} />
                <Route path={ROUTES.admin.settings} element={<RequirePin moduleId="settings"><SettingsPage /></RequirePin>} />
                <Route path={ROUTES.admin.orders} element={<RequirePin moduleId="orders"><OrdersPage /></RequirePin>} />
                <Route path={ROUTES.admin.cash} element={<RequirePin moduleId="cash"><CashRegisterPage /></RequirePin>} />
                <Route path={ROUTES.admin.reservations} element={<RequirePin moduleId="reservations"><AdminReservationsPage /></RequirePin>} />
                <Route path={ROUTES.admin.plan} element={<PlanPage />} />
                <Route path={ROUTES.admin.loyalty} element={<RequirePin moduleId="loyalty"><LoyaltyPage /></RequirePin>} />
                <Route path={ROUTES.admin.customers} element={<CustomersPage />} />
                <Route path={ROUTES.admin.inventory} element={<InventoryPage />} />
              </Route>
            </Route>

            {/* ── Platform super-admin routes ── */}
            <Route element={<PlatformAdminGuard />}>
              <Route element={<PlatformAdminLayout />}>
                <Route path={ROUTES.platformAdmin.root} element={<Navigate to={ROUTES.platformAdmin.dashboard} replace />} />
                <Route path={ROUTES.platformAdmin.dashboard} element={<PlatformDashboardPage />} />
                <Route path={ROUTES.platformAdmin.tenants} element={<TenantsListPage />} />
                <Route path={ROUTES.platformAdmin.tenantDetail} element={<TenantDetailPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
