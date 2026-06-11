import { NavLink, useLocation, Link } from 'react-router-dom'
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
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { cn }               from '@shared/utils/cn'
import { ROUTES }           from '@shared/constants/routes'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useAuth }          from '@features/auth'
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
      { label: 'Menú',          path: ROUTES.admin.menu.list,   icon: BookOpen },
      { label: 'Platos',        path: ROUTES.admin.dishes.list, icon: ChefHat },
      { label: 'Mesas & QR',    path: ROUTES.admin.qr,          icon: QrCode },
    ],
  },
  {
    label: 'Personalización',
    items: [
      { label: 'Apariencia',    path: ROUTES.admin.appearance,  icon: Palette, badge: 'IA', badgeVariant: 'violet' },
    ],
  },
  {
    label: 'Datos',
    items: [
      { label: 'Analíticas',    path: ROUTES.admin.analytics,   icon: BarChart3 },
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
  const { tenant }                          = useTenantContext()
  const { user, signOut } = useAuth()

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
          'lg:static lg:z-auto',
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
        <nav className="sidebar-scroll flex flex-1 flex-col overflow-y-auto px-2 py-3 gap-5">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-0.5">
              {group.label && (
                <p
                  className="mb-1 px-2 text-[9.5px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <SidebarNavItem key={item.path} item={item} onNavigate={onClose} />
              ))}
            </div>
          ))}
        </nav>

        {/* ── AI assistant card ─────────────────────────────────────────────── */}
        <div className="mx-3 mb-3">
          <Link
            to={`${ROUTES.admin.editor}?openDigitalize=1`}
            onClick={onClose}
            className="relative block overflow-hidden rounded-xl p-3 transition-all duration-150 hover:brightness-125 active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(139,92,246,0.08) 100%)',
              border: '1px solid rgba(139,92,246,0.22)',
            }}
          >
            {/* Glow dot */}
            <div
              className="absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)' }}
            />
            <div className="flex items-center gap-2 mb-1">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                style={{ background: 'rgba(139,92,246,0.3)' }}
              >
                <Sparkles size={10} className="text-violet-300" />
              </div>
              <p className="text-[11.5px] font-semibold" style={{ color: 'rgba(221,214,254,0.9)' }}>
                Asistente IA
              </p>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(196,181,253,0.6)' }}>
              Digitaliza tu menú físico con una foto.
            </p>
            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-[9.5px] font-semibold" style={{ color: 'rgba(196,181,253,0.75)' }}>
                Abrir digitalizador
              </span>
              <ChevronRight size={9} style={{ color: 'rgba(196,181,253,0.5)' }} />
            </div>
          </Link>
        </div>

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
      className="group relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-all duration-100"
      style={{
        color:      isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.42)',
        background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color      = 'rgba(255,255,255,0.72)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.045)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color      = 'rgba(255,255,255,0.42)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      {/* Active left accent */}
      {isActive && (
        <span
          className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-r-full"
          style={{ background: 'linear-gradient(180deg, #f5b520 0%, #e99a0e 100%)' }}
        />
      )}

      <Icon
        size={15}
        strokeWidth={isActive ? 2.2 : 1.7}
        style={{
          color: isActive ? '#f5b520' : 'rgba(255,255,255,0.35)',
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
