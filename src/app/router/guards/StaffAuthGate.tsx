import { useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { KeyRound } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useAuthContext } from '@app/providers/AuthProvider'
import { auth } from '@infrastructure/firebase/auth'
import { staffAuthEmail } from '@infrastructure/services/StaffAccountService'
import { Spinner } from '@shared/ui/components/Spinner'

function StaffPinScreen({ tenantId }: { tenantId: string }) {
  const { tenant } = useTenantContext()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!auth) {
      setError('Servicio no disponible.')
      return
    }
    if (pin.length < 6) {
      setError('El PIN tiene al menos 6 dígitos.')
      return
    }
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, staffAuthEmail(tenantId), pin)
      // onAuthStateChanged actualiza el contexto → el gate renderiza el panel.
    } catch (err) {
      const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : ''
      if (code === 'auth/user-not-found') {
        setError('Este menú aún no tiene acceso de staff. Pídeselo al dueño.')
      } else {
        setError('PIN incorrecto. Intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-surface-50 p-4">
      <div className="w-full max-w-xs">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 shadow-lg">
            <KeyRound size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900">{tenant?.name ?? 'Panel de staff'}</h1>
            <p className="mt-0.5 text-sm text-surface-500">Ingresa el PIN del equipo</p>
          </div>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e) }} className="rounded-2xl border border-surface-100 bg-surface-0 p-6 shadow-sm flex flex-col gap-4">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            autoComplete="off"
            placeholder="••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-center text-2xl tracking-[0.4em] font-bold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          />

          {error && <p className="text-xs font-semibold text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || pin.length < 6}
            className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner size="sm" /> : null}
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-surface-400">
          Panel operativo · solo lo necesario para tu turno
        </p>

        <div className="mt-8 text-center">
          <a href="/admin" className="text-xs font-bold text-surface-500 hover:text-surface-800 transition-colors">
            ¿Eres el dueño? Ir al Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * Puerta del panel de staff. Si el visitante NO está autenticado como la cuenta
 * de staff de este menú, muestra la pantalla de PIN. Si sí, renderiza el panel.
 * El PIN es la contraseña de una cuenta de Firebase derivada del tenant, así que
 * un PIN correcto = sesión real autorizada por las reglas (member rol staff).
 */
export function StaffAuthGate() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const { firebaseUser, isLoading } = useAuthContext()

  if (!tenantId) return null

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-surface-50">
        <Spinner size="lg" />
      </div>
    )
  }

  const isStaffHere = firebaseUser?.email === staffAuthEmail(tenantId)
  if (isStaffHere) return <Outlet />

  return <StaffPinScreen tenantId={tenantId} />
}
