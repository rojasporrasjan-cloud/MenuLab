import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  ChefHat,
  QrCode,
  Palette,
  BarChart3,
  Settings,
  UtensilsCrossed,
  LogOut,
  X,
  ChevronRight,
  ShoppingBag,
  CookingPot,
  CalendarCheck,
  CreditCard,
  Star,
  Users,
  Package,
  MonitorSmartphone,
  Wallet,
} from 'lucide-react'
import { cn }               from '@shared/utils/cn'
import { ROUTES }           from '@shared/constants/routes'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useAuth }          from '@features/auth'
import { usePendingReservations } from '@features/reservations'
import { useLowStockAlerts } from '@features/inventory'
import { useActiveOrders } from '@features/cart'
import type { NavItem }     from '../../types/dashboard.types'

// ─── Nav structure ────────────────────────────────────────────────────────────

interface NavGroup {
  readonly label?: string
  readonly items: NavItem[]
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    items: [
      { label: 'Dashboard',     path: ROUTES.admin.dashboard,   icon: LayoutDashboard },
    ],
  },
  {
    label: 'Mi Carta',
    items: [
      { label: 'Menú',          path: ROUTES.admin.menu.list,   icon: BookOpen },
      { label: 'Platos',        path: ROUTES.admin.dishes.list, icon: ChefHat },
      { label: 'Mesas & QR',    path: ROUTES.admin.qr,          icon: QrCode },
      { label: 'Apariencia',    path: ROUTES.admin.appearance,  icon: Palette, badge: 'IA', badgeVariant: 'violet' },
    ],
  },
  {
    label: 'Operación',
    items: [
      { label: 'Pedidos',       path: ROUTES.admin.orders,      icon: ShoppingBag },
      { label: 'POS',           path: ROUTES.admin.pos,         icon: MonitorSmartphone },
      { label: 'Cocina',        path: ROUTES.admin.kds,         icon: CookingPot },
      { label: 'Caja',          path: ROUTES.admin.cash,        icon: Wallet },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { label: 'Reservas',      path: ROUTES.admin.reservations, icon: CalendarCheck },
      { label: 'Clientes',      path: ROUTES.admin.customers,    icon: Users },
      { label: 'Lealtad',       path: ROUTES.admin.loyalty,      icon: Star },
    ],
  },
  {
    label: 'Inventario y datos',
    items: [
      { label: 'Inventario',    path: ROUTES.admin.inventory,   icon: Package },
      { label: 'Analíticas',    path: ROUTES.admin.analytics,   icon: BarChart3 },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { label: 'Mi Plan',       path: ROUTES.admin.plan,        icon: CreditCard },
      { label: 'Configuración', path: ROUTES.admin.settings,    icon: Settings },
    ],
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen:  boolean
  onClose: () => void
  isCollapsed?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ isOpen, onClose, isCollapsed = false }: SidebarProps) {
  const { tenant, tenantId }                = useTenantContext()
  const { user, signOut } = useAuth()
  const { count: pendingReservations } = usePendingReservations(tenantId)
  const { count: lowStockCount } = useLowStockAlerts(tenantId)
  const { orders: activeOrders } = useActiveOrders(tenantId)

  // Badges dinámicos por ruta (conteos en tiempo real).
  const dynamicBadges: Record<string, { count: number; variant?: NavItem['badgeVariant'] }> = {
    [ROUTES.admin.orders]:       { count: activeOrders.length },
    [ROUTES.admin.reservations]: { count: pendingReservations },
    [ROUTES.admin.inventory]:    { count: lowStockCount, variant: 'danger' },
  }

  const displayName = user?.displayName ?? ''
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        role="navigation"
        aria-label="Navegación principal"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col',
          'transition-all duration-200 ease-in-out',
          'lg:static lg:z-auto lg:h-svh',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:-translate-x-full lg:w-0 lg:opacity-0 overflow-hidden' : 'lg:translate-x-0 lg:w-[220px] lg:opacity-100',
        )}
        style={{
          background: '#111110',
          borderRight: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
        }}
      >

        {/* ── Brand header ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {tenant?.branding.logoUrl ? (
            <img
              src={tenant.branding.logoUrl}
              alt={tenant.name}
              className="h-8 w-8 shrink-0 rounded-lg object-contain"
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
            />
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #e99a0e 0%, #cc7809 100%)',
                boxShadow: '0 2px 8px rgba(233,154,14,0.35)',
              }}
            >
              <UtensilsCrossed size={15} className="text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: '#f4f3f0' }}>
              {tenant?.name ?? 'Mi Restaurante'}
            </p>
            <PlanBadge plan={tenant?.plan ?? 'free'} />
          </div>

          {/* Mobile close */}
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md lg:hidden"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────────── */}
        <nav className="sidebar-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 py-3 gap-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-[3px]">
              {group.label && (
                <p
                  className="mb-1 px-2.5 text-[9.5px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: 'rgba(255,255,255,0.32)' }}
                >
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const dynamicBadge = dynamicBadges[item.path]
                const resolved =
                  item.badge === undefined && dynamicBadge !== undefined && dynamicBadge.count > 0
                    ? { ...item, badge: dynamicBadge.count, badgeVariant: dynamicBadge.variant }
                    : item
                return <SidebarNavItem key={item.path} item={resolved} onNavigate={onClose} />
              })}
            </div>
          ))}
        </nav>

        {/* ── User footer ───────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2.5 px-3 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {user?.photoURL ? (
            <img
              src={user?.photoURL ?? undefined}
              alt={displayName}
              className="h-7 w-7 shrink-0 rounded-full object-cover"
              style={{ boxShadow: '0 0 0 1.5px rgba(255,255,255,0.1)' }}
            />
          ) : (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
                boxShadow: '0 0 0 1.5px rgba(255,255,255,0.1)',
              }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-[12px] font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {displayName}
            </p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Administrador
            </p>
          </div>
          <button
            onClick={signOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function SidebarNavItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const location = useLocation()
  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  const Icon     = item.icon

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className="group relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[13px] font-medium transition-all duration-100"
      style={{
        color:      isActive ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.44)',
        background: isActive
          ? 'linear-gradient(90deg, rgba(245,181,32,0.16) 0%, rgba(245,181,32,0.035) 100%)'
          : 'transparent',
        boxShadow:  isActive ? 'inset 0 0 0 1px rgba(245,181,32,0.14)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color      = 'rgba(255,255,255,0.82)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color      = 'rgba(255,255,255,0.44)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      {/* Active left accent */}
      {isActive && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
          style={{ background: 'linear-gradient(180deg, #f5b520 0%, #e99a0e 100%)', boxShadow: '0 0 8px rgba(245,181,32,0.5)' }}
        />
      )}

      <Icon
        size={16}
        strokeWidth={isActive ? 2.2 : 1.7}
        style={{
          color: isActive ? '#f5b520' : 'rgba(255,255,255,0.38)',
          flexShrink: 0,
          transition: 'color 100ms',
        }}
      />

      <span className="flex-1 truncate">{item.label}</span>

      {/* Badge */}
      {item.badge !== undefined && (
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
          style={
            item.badgeVariant === 'violet'
              ? { background: 'rgba(139,92,246,0.3)', color: '#c4b5fd' }
              : item.badgeVariant === 'danger'
                ? { background: 'rgba(239,68,68,0.32)', color: '#fca5a5' }
                : { background: 'rgba(233,154,14,0.3)', color: '#f5b520' }
          }
        >
          {item.badge}
        </span>
      )}

      {/* Chevron on active */}
      {isActive && (
        <ChevronRight size={11} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
      )}
    </NavLink>
  )
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

type Plan = 'free' | 'starter' | 'pro' | 'enterprise'

const PLAN_LABEL: Record<Plan, string> = {
  free:       'Gratis',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
}

const PLAN_STYLE: Record<Plan, React.CSSProperties> = {
  free:       { color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.07)' },
  starter:    { color: '#60a5fa',                background: 'rgba(96,165,250,0.12)' },
  pro:        { color: '#f5b520',                background: 'rgba(245,181,32,0.12)' },
  enterprise: { color: '#c4b5fd',                background: 'rgba(196,181,253,0.12)' },
}

function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span
      className="inline-block rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider mt-0.5"
      style={PLAN_STYLE[plan]}
    >
      {PLAN_LABEL[plan]}
    </span>
  )
}
