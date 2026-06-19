import { useState } from 'react'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { AuthService, parseAuthError } from '@features/auth'
import { sha256 } from '@shared/utils/sha256'
import { Button } from '@shared/ui/components/Button'
import { useUpdateEmployeePin } from '../../hooks/useUpdateEmployeePin'

interface PinRecoveryProps {
  readonly onRecovered: () => void
  readonly onBack: () => void
}

type RecoveryStep = 'identity' | 'newPin'

function ErrorBox({ message }: { readonly message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-[13px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
      <AlertCircle size={14} />
      {message}
    </div>
  )
}

export function PinRecovery({ onRecovered, onBack }: PinRecoveryProps) {
  const { tenantId } = useTenantContext()
  const provider = AuthService.getAuthProvider()
  const { updatePin, isLoading: isSavingPin } = useUpdateEmployeePin(tenantId)

  const [step, setStep] = useState<RecoveryStep>('identity')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsVerifying(true)
    try {
      await AuthService.reauthenticate(provider === 'password' ? password : undefined)
      setPassword('')
      setStep('newPin')
    } catch (err) {
      setError(parseAuthError(err))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSetNewPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^\d{4,6}$/.test(pin)) {
      setError('El PIN debe tener entre 4 y 6 dígitos numéricos.')
      return
    }
    if (pin !== confirm) {
      setError('Los PINs no coinciden.')
      return
    }
    const hash = await sha256(pin)
    await updatePin(hash)
    onRecovered()
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-[360px] bg-white rounded-3xl shadow-sm border border-zinc-200/80 p-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-5 border border-amber-100">
          <ShieldCheck className="text-amber-500" size={24} />
        </div>

        {step === 'identity' ? (
          <>
            <h2 className="text-[20px] font-bold text-zinc-800 mb-2">Confirma tu identidad</h2>
            <p className="text-[13px] text-zinc-500 mb-8 max-w-[280px]">
              Solo el dueño puede restablecer el PIN.{' '}
              {provider === 'google'
                ? 'Confírmalo con tu cuenta de Google.'
                : 'Ingresa la contraseña de tu cuenta para continuar.'}
            </p>

            <form onSubmit={(e) => { void handleVerify(e) }} className="w-full space-y-6">
              {provider === 'password' && (
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Contraseña de tu cuenta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                />
              )}

              {error && <ErrorBox message={error} />}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full flex-1"
                  onClick={onBack}
                  disabled={isVerifying}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full flex-1"
                  isLoading={isVerifying}
                  disabled={isVerifying || (provider === 'password' && password.length === 0)}
                >
                  {provider === 'google' ? 'Confirmar con Google' : 'Continuar'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-[20px] font-bold text-zinc-800 mb-2">Crea un PIN nuevo</h2>
            <p className="text-[13px] text-zinc-500 mb-8 max-w-[280px]">
              Identidad confirmada. Define tu nuevo PIN maestro (4–6 dígitos).
            </p>

            <form onSubmit={(e) => { void handleSetNewPin(e) }} className="w-full space-y-4">
              <input
                type="password"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                placeholder="Nuevo PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-center text-xl tracking-[0.2em] outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              />
              <input
                type="password"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                placeholder="Confirmar PIN"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-center text-xl tracking-[0.2em] outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              />

              {error && <ErrorBox message={error} />}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSavingPin}
                disabled={isSavingPin || pin.length < 4 || confirm.length < 4}
              >
                Guardar PIN y entrar
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
