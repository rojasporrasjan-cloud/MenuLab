import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@shared/constants/routes'

import { AuthGuard } from './guards/AuthGuard'
import RootLayout from '@app/layouts/RootLayout'
import { AdminLayout } from '@app/layouts/AdminLayout'
import { PublicLayout } from '@app/layouts/PublicLayout'
import { MarketingLayout } from '@app/layouts/MarketingLayout'

import {
  LandingPage,
  TemplatesGalleryPage,
  QuotePage,
  MenuPage,
  DishDetailPage,
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
  LoginPage,
  RegisterPage,
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
            </Route>

            {/* ── Auth routes ── */}
            <Route path={ROUTES.auth.login} element={<LoginPage />} />
            <Route path={ROUTES.auth.register} element={<RegisterPage />} />

            {/* ── Protected admin routes ── */}
            <Route element={<AuthGuard />}>

              {/* Editor is full-screen standalone — has its own topbar/left-rail, no admin shell */}
              <Route path={ROUTES.admin.editor} element={<EditorPage />} />

              <Route element={<AdminLayout />}>
                <Route path={ROUTES.admin.root} element={<Navigate to={ROUTES.admin.dashboard} replace />} />
                <Route path={ROUTES.admin.dashboard} element={<DashboardPage />} />
                <Route path={ROUTES.admin.menu.list} element={<MenuManagerPage />} />
                <Route path={ROUTES.admin.dishes.list} element={<DishListPage />} />
                <Route path={ROUTES.admin.dishes.new} element={<DishEditorPage />} />
                <Route path={ROUTES.admin.dishes.editor} element={<DishEditorPage />} />
                <Route path={ROUTES.admin.qr} element={<QRManagerPage />} />
                <Route path={ROUTES.admin.templates} element={<TemplatesPage />} />
                <Route path={ROUTES.admin.appearance} element={<AppearancePage />} />
                <Route path={ROUTES.admin.analytics} element={<AnalyticsPage />} />
                <Route path={ROUTES.admin.settings} element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
