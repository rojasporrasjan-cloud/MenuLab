import { useState, useRef } from 'react'
import { User, CreditCard, Users, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { cn } from '@shared/utils/cn'
import { sha256 } from '@shared/utils/sha256'
import {
  ProfileForm,
  PlanInfo,
  useUpdateProfile,
  useUpdateEmployeePin,
} from '@features/settings'
import { Spinner } from '@shared/ui/components/Spinner'
import { StaffAccountService } from '@infrastructure/services/StaffAccountService'
import { ROUTES } from '@shared/constants/routes'
import type { SettingsTab } from '@features/settings'
import type { ProfileFormValues } from '@features/settings'

interface TabDef {
  key: SettingsTab
  label: string
  icon: React.ElementType
}

const TABS: TabDef[] = [
  { key: 'profile',   label: 'Perfil',     icon: User       },
  { key: 'plan',      label: 'Plan',       icon: CreditCard },
  { key: 'employees', label: 'Empleados',  icon: Users      },
]

// ── Employee PIN form ──────────────────────────────────────────────────────────
function EmployeePinSection({
  tenantId,
  hasPinSet,
}: {
  tenantId: string
  hasPinSet: boolean
}) {
  const { updatePin, isLoading, error, success } = useUpdateEmployeePin(tenantId)
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const pinRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!/^\d{4,6}$/.test(pin)) {
      setLocalError('El PIN debe tener entre 4 y 6 dígitos numéricos.')
      return
    }
    if (pin !== confirm) {
      setLocalError('Los PINs no coinciden.')
      return
    }

    const hash = await sha256(pin)
    await updatePin(hash)
    setPin('')
    setConfirm('')
    pinRef.current?.focus()
  }

  const displayError = localError ?? error

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-5">

      {/* Status banner */}
      <div className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 text-[13px]',
        hasPinSet
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200',
      )}>
        <div className={cn(
          'size-2 rounded-full',
          hasPinSet ? 'bg-emerald-500' : 'bg-amber-500',
        )} />
        <span>
          {hasPinSet
            ? 'PIN de empleados configurado. Puedes cambiarlo en cualquier momento.'
            : 'Aún no has configurado un PIN. Los empleados no podrán acceder al panel.'}
        </span>
      </div>

      {/* PIN field */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-zinc-700" htmlFor="emp-pin">
          Nuevo PIN
        </label>
        <div className="relative">
          <input
            ref={pinRef}
            id="emp-pin"
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            placeholder="4–6 dígitos"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 pr-10 text-[14px] outline-none ring-0 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPin(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Confirm PIN field */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-zinc-700" htmlFor="emp-pin-confirm">
          Confirmar PIN
        </label>
        <input
          id="emp-pin-confirm"
          type={showPin ? 'text' : 'password'}
          inputMode="numeric"
          pattern="\d*"
          maxLength={6}
          placeholder="4–6 dígitos"
          value={confirm}
          onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[14px] outline-none ring-0 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {displayError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-700 border border-red-200">
          <AlertCircle size={14} />
          {displayError}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={14} />
          PIN actualizado correctamente
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !pin || !confirm}
        className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? <Spinner size="sm" /> : null}
        {hasPinSet ? 'Actualizar PIN' : 'Crear PIN'}
      </button>
    </form>
  )
}

// ── Staff PIN form (acceso de trabajadores al panel del menú) ───────────────────
function StaffAccountSection({ tenantId }: { tenantId: string }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const staffUrl = ROUTES.staff.home(tenantId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!/^\d{6,8}$/.test(pin)) {
      setError('El PIN debe tener entre 6 y 8 dígitos.')
      return
    }
    if (pin !== confirm) {
      setError('Los PINs no coinciden.')
      return
    }
    setIsLoading(true)
    try {
      await StaffAccountService.setStaffPin({ tenantId, pin })
      setSuccess(true)
      setPin('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo configurar el PIN de staff.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
      <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3 text-[12px] text-zinc-600 leading-relaxed">
        Tus trabajadores entran en{' '}
        <code className="rounded bg-zinc-200 px-1 py-0.5 text-[11px] font-semibold text-zinc-700">{staffUrl}</code>{' '}
        y escriben este PIN — desde cualquier celular. Comparte ese link + el PIN con tu equipo. Solo ven lo operativo (pedidos, disponibilidad, promos/horarios, mesas), nunca el diseño ni el plan.
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-zinc-700" htmlFor="staff-pin">PIN de acceso (6–8 dígitos)</label>
        <div className="relative">
          <input
            id="staff-pin"
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={8}
            autoComplete="off"
            placeholder="6 a 8 dígitos"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 pr-10 text-[14px] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPin((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-zinc-700" htmlFor="staff-pin-confirm">Confirmar PIN</label>
        <input
          id="staff-pin-confirm"
          type={showPin ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={8}
          autoComplete="off"
          placeholder="Repite el PIN"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[14px] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-700 border border-red-200">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={14} />
          PIN de staff configurado. Tu equipo ya puede entrar en {staffUrl}.
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !pin || !confirm}
        className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? <Spinner size="sm" /> : null}
        Configurar PIN de staff
      </button>
    </form>
  )
}

// ── Main SettingsPage ──────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { tenant, tenantId } = useTenantContext()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const {
    updateProfile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useUpdateProfile(tenantId)

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    await updateProfile(values)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Configuración
        </p>
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-zinc-900">
          Ajustes
        </h1>
      </div>

      <div className="flex gap-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-all',
              activeTab === key
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700',
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
        {activeTab === 'profile' && tenant && (
          <ProfileForm
            tenant={tenant}
            isLoading={isProfileLoading}
            error={profileError}
            success={false}
            onSubmit={(values) => { void handleProfileSubmit(values) }}
          />
        )}
        {activeTab === 'plan' && tenant && (
          <PlanInfo tenant={tenant} />
        )}
        {activeTab === 'employees' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-800">Cuenta de staff (panel separado)</h2>
                <p className="text-[13px] text-zinc-500 mt-0.5">
                  Acceso de tus trabajadores al panel operativo, separado de tu admin.
                </p>
              </div>
              <StaffAccountSection tenantId={tenantId} />
            </div>

            <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6">
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-800">PIN de empleados (POS)</h2>
                <p className="text-[13px] text-zinc-500 mt-0.5">
                  Este PIN identifica a cada empleado en el comandero POS.
                </p>
              </div>
              <EmployeePinSection
                tenantId={tenantId}
                hasPinSet={!!tenant?.employeePinHash}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
