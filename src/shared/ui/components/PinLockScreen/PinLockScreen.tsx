import { useState, useRef, useEffect } from 'react'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { sha256 } from '@shared/utils/sha256'
import { Button } from '../Button'

interface PinLockScreenProps {
  onUnlock: () => void
  onCancel?: () => void
  onForgotPin?: () => void
}

export function PinLockScreen({ onUnlock, onCancel, onForgotPin }: PinLockScreenProps) {
  const { tenant } = useTenantContext()
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!tenant?.employeePinHash) {
      onUnlock()
      return
    }

    setIsLoading(true)
    const hash = await sha256(pin)
    
    if (hash === tenant.employeePinHash) {
      onUnlock()
    } else {
      setError('PIN incorrecto. Intenta de nuevo.')
      setPin('')
      inputRef.current?.focus()
    }
    setIsLoading(false)
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6 bg-zinc-50/50">
      <div className="w-full max-w-[360px] bg-white rounded-3xl shadow-sm border border-zinc-200/80 p-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-5 border border-amber-100">
          <Lock className="text-amber-500" size={24} />
        </div>
        
        <h2 className="text-[20px] font-bold text-zinc-800 mb-2">
          Módulo Bloqueado
        </h2>
        <p className="text-[13px] text-zinc-500 mb-8 max-w-[280px]">
          Esta sección está protegida. Ingresa el PIN maestro para acceder.
        </p>

        <form onSubmit={(e) => { void handleSubmit(e) }} className="w-full space-y-6">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              placeholder="••••"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-10 text-center text-xl tracking-[0.2em] outline-none ring-0 transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPin(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-[13px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full flex-1"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full flex-1"
              isLoading={isLoading}
              disabled={isLoading || pin.length < 4}
            >
              Desbloquear
            </Button>
          </div>
        </form>

        {onForgotPin ? (
          <button
            type="button"
            onClick={onForgotPin}
            className="mt-6 text-[13px] font-semibold text-amber-600 transition-colors hover:text-amber-700 hover:underline"
          >
            ¿Olvidaste el PIN? Restablécelo con tu cuenta
          </button>
        ) : (
          <p className="mt-6 text-[12px] leading-relaxed text-zinc-400">
            ¿Olvidaste el PIN? El propietario puede restablecerlo desde{' '}
            <span className="font-semibold text-zinc-500">Configuración → Accesos y Empleados</span>.
          </p>
        )}
      </div>
    </div>
  )
}
