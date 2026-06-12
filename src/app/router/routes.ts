import { lazy } from 'react'

// ── Marketing (public acquisition funnel) ────────────────────────────────────
export const LandingPage = lazy(() => import('@pages/marketing/LandingPage'))
export const TemplatesGalleryPage = lazy(() => import('@pages/marketing/TemplatesGalleryPage'))
export const QuotePage = lazy(() => import('@pages/marketing/QuotePage'))

// ── Public (customer-facing) ─────────────────────────────────────────────────
export const MenuPage = lazy(() => import('@pages/public/MenuPage'))
export const DishDetailPage = lazy(() => import('@pages/public/DishDetailPage'))
export const NotFoundPage = lazy(() => import('@pages/public/NotFoundPage'))
export const PublicReservationsPage = lazy(() => import('@pages/public/ReservationsPage'))

// ── Admin ────────────────────────────────────────────────────────────────────
export const DashboardPage = lazy(() => import('@pages/admin/DashboardPage'))
export const EditorPage = lazy(() => import('@features/editor/pages/EditorPage'))
export const MenuManagerPage = lazy(() => import('@pages/admin/MenuManagerPage'))
export const DishListPage = lazy(() => import('@pages/admin/DishListPage'))
export const DishEditorPage = lazy(() => import('@pages/admin/DishEditorPage'))
export const QRManagerPage = lazy(() => import('@pages/admin/QRManagerPage'))
export const TemplatesPage = lazy(() => import('@pages/admin/TemplatesPage'))
export const AppearancePage = lazy(() => import('@pages/admin/AppearancePage'))
export const AnalyticsPage = lazy(() => import('@pages/admin/AnalyticsPage'))
export const SettingsPage = lazy(() => import('@pages/admin/SettingsPage'))
export const OrdersPage = lazy(() => import('@pages/admin/OrdersPage'))
export const KDSPage = lazy(() => import('@pages/admin/KDSPage'))
export const AdminReservationsPage = lazy(() => import('@pages/admin/ReservationsPage'))
export const PlanPage = lazy(() => import('@pages/admin/PlanPage'))
export const LoyaltyPage = lazy(() => import('@pages/admin/LoyaltyPage'))
export const CustomersPage = lazy(() => import('@pages/admin/CustomersPage'))
export const InventoryPage = lazy(() => import('@pages/admin/InventoryPage'))
export const POSPage = lazy(() => import('@pages/admin/POSPage'))

// ── Staff panel (trabajadores) ───────────────────────────────────────────────
export const StaffAvailabilityPage = lazy(() => import('@pages/staff/StaffAvailabilityPage'))
export const StaffPromosPage = lazy(() => import('@pages/staff/StaffPromosPage'))

// ── Auth ─────────────────────────────────────────────────────────────────────
export const LoginPage = lazy(() => import('@pages/auth/LoginPage'))
export const RegisterPage = lazy(() => import('@pages/auth/RegisterPage'))

// ── Platform Admin ───────────────────────────────────────────────────────────
export const TenantsListPage = lazy(() => import('@pages/platform-admin/TenantsListPage'))
