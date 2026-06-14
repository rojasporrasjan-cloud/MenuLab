import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users } from 'lucide-react'
import { useAuthContext } from '@app/providers/AuthProvider'
import { ROUTES } from '@shared/constants/routes'
import { auth } from '@infrastructure/firebase/auth'
import { signOut } from 'firebase/auth'

const NAV = [
  { label: 'Dashboard', to: ROUTES.platformAdmin.dashboard, icon: LayoutDashboard },
  { label: 'Clientes',  to: ROUTES.platformAdmin.tenants,   icon: Users },
] as const

export function PlatformAdminLayout() {
  const { firebaseUser } = useAuthContext()

  async function handleSignOut(): Promise<void> {
    if (auth) await signOut(auth)
  }

  return (
    <div className="min-h-svh" style={{ background: '#0f0f11' }}>
      {/* Topbar */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#18181b' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: '#e11d48', color: '#fff' }}
          >
            M
          </div>
          <div>
            <span className="text-white font-semibold text-sm">MenuLab</span>
            <span
              className="ml-2 text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(225,29,72,0.15)', color: '#fb7185' }}
            >
              Platform Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: '#71717a' }}>
            {firebaseUser?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-md transition-colors"
            style={{ color: '#a1a1aa', background: 'rgba(255,255,255,0.06)' }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* Navegación del panel de plataforma */}
      <nav className="flex items-center gap-1 border-b px-6" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#141416' }}>
        {NAV.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors"
            style={({ isActive }) => ({ color: isActive ? '#ffffff' : '#71717a' })}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} />
                {label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: '#f5b520' }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <main className="p-6 lg:p-8 mx-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
