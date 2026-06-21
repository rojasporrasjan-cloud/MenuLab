import { useState, useRef } from 'react'
import { CreditCard, Users, Eye, EyeOff, CheckCircle2, AlertCircle, UserCircle, Smartphone, Lock } from 'lucide-react'
import { PageHeader } from '@shared/ui/components/PageHeader'
import { useTenantContext } from '@app/providers/TenantProvider'
import { cn } from '@shared/utils/cn'
import { sha256 } from '@shared/utils/sha256'
import {
  ProfileForm,
  PlanInfo,
  useUpdateProfile,
  useUpdateEmployeePin,
  useUpdateLockedModules,
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
  description: string
}

const TABS: TabDef[] = [
  { key: 'profile',   label: 'Perfil del Restaurante',     icon: UserCircle, description: 'Datos básicos, logo y redes sociales.' },
  { key: 'plan',      label: 'Suscripción',       icon: CreditCard, description: 'Tu plan actual y facturación.' },
  { key: 'employees', label: 'Accesos y Empleados',  icon: Users, description: 'Control de pines y permisos operativos.' },
]

// ─── Header Info ──────────────────────────────────────────────────────────────
function SettingsHeader() {
  return (
    <div className="mb-8">
      <PageHeader
        eyebrow="Cuenta"
        title="Configuración"
        subtitle="Ajusta los detalles generales de tu negocio y la seguridad de tu panel."
      />
    </div>
  )
}

// ── Employee PIN form ──────────────────────────────────────────────────────────

const MODULES = [
  { id: 'dashboard', label: 'Panel de Control' },
  { id: 'orders', label: 'Pedidos / POS' },
  { id: 'cash', label: 'Caja (cierre / arqueo)' },
  { id: 'reservations', label: 'Reservaciones' },
  { id: 'dishes', label: 'Platillos (Catálogo)' },
  { id: 'menu', label: 'Menús y Categorías' },
  { id: 'kds', label: 'Pantalla de Cocina (KDS)' },
  { id: 'templates', label: 'Plantillas Visuales' },
  { id: 'appearance', label: 'Apariencia y Secciones' },
  { id: 'qr', label: 'Códigos QR' },
  { id: 'loyalty', label: 'Programa de Lealtad' },
  { id: 'analytics', label: 'Reportes y Métricas' },
  { id: 'settings', label: 'Configuración (esta pantalla)' },
]

function EmployeePinSection({
  tenantId,
  hasPinSet,
  lockedModules,
}: {
  tenantId: string
  hasPinSet: boolean
  lockedModules: string[]
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

    if (!/^\d{4,8}$/.test(pin)) {
      setLocalError('El PIN debe tener entre 4 y 8 dígitos numéricos.')
      return
    }
    if (pin !== confirm) {
      setLocalError('Los PINs no coinciden.')
      return
    }

    try {
      const hash = await sha256(pin)
      await updatePin(hash)
      setPin('')
      setConfirm('')
      pinRef.current?.focus()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error interno al cifrar el PIN.')
    }
  }

  const [localLocked, setLocalLocked] = useState<string[]>(lockedModules)
  // Resincroniza la selección local cuando el tenant cambia (ej. tras guardar y
  // refetch). Patrón oficial de React: ajustar estado durante el render en vez
  // de un useEffect, que dispararía renders en cascada.
  const [syncedLocked, setSyncedLocked] = useState<string[]>(lockedModules)
  if (syncedLocked !== lockedModules) {
    setSyncedLocked(lockedModules)
    setLocalLocked(lockedModules)
  }

  const handleToggleModule = (moduleId: string) => {
    setLocalLocked(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    )
  }

  const { updateLockedModules, isLoading: isUpdatingModules, success: modulesSuccess } = useUpdateLockedModules(tenantId)

  const handleSaveModules = async () => {
    await updateLockedModules(localLocked)
  }

  const hasModuleChanges = JSON.stringify([...localLocked].sort()) !== JSON.stringify([...lockedModules].sort())

  const displayError = localError ?? error

  return (
    <div className="space-y-8 rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4 border-b border-black/[0.04] pb-6">
         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
           <Lock size={24} />
         </div>
         <div>
            <h2 className="text-lg font-black text-neutral-900 tracking-tight">PIN de Empleados (POS)</h2>
            <p className="text-[13.5px] text-neutral-500 mt-1">Este PIN identifica a cada empleado en el comandero POS y bloquea áreas sensibles.</p>
            <div className="mt-3 inline-flex items-start gap-2 rounded-xl bg-amber-50/50 border border-amber-100/50 p-3 text-[13px] text-amber-800">
              <Lock size={16} className="shrink-0 mt-0.5" />
              <p><strong>Dato útil:</strong> Este mismo PIN Maestro se usa para <strong>desbloquear las pantallas</strong> cuando usas el Modo Terminal (ej. fijar la tablet en Cocina o en Caja).</p>
            </div>
         </div>
      </div>

      <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-6">
        {/* Status banner */}
        <div className={cn(
          'flex items-start gap-3 rounded-2xl px-5 py-4 text-[13.5px] font-medium leading-relaxed transition-colors border',
          hasPinSet
            ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/60 shadow-sm'
            : 'bg-amber-50/80 text-amber-800 border-amber-200/60 shadow-sm',
        )}>
          <div className={cn(
            'mt-1 flex h-2 w-2 shrink-0 rounded-full shadow-sm',
            hasPinSet ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50',
          )} />
          <span>
            {hasPinSet
              ? 'PIN maestro configurado. Úsalo para proteger secciones clave del panel.'
              : 'Configura un PIN maestro para bloquear el acceso a ciertos módulos. Tus empleados no podrán entrar sin él.'}
          </span>
        </div>

        {/* PIN field */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-[13px] font-bold uppercase tracking-wider text-neutral-500" htmlFor="emp-pin">
              Nuevo PIN
            </label>
            <div className="relative">
              <input
                ref={pinRef}
                id="emp-pin"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="\d*"
                maxLength={8}
                placeholder="4–8 dígitos"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 pr-12 text-[15px] font-bold outline-none transition-colors focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPin(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-bold uppercase tracking-wider text-neutral-500" htmlFor="emp-pin-confirm">
              Confirmar PIN
            </label>
            <div className="relative">
               <input
                 id="emp-pin-confirm"
                 type={showPin ? 'text' : 'password'}
                 inputMode="numeric"
                 pattern="\d*"
                 maxLength={8}
                 placeholder="Repítelo"
                 value={confirm}
                 onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))}
                 className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 text-[15px] font-bold outline-none transition-colors focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
               />
            </div>
          </div>
        </div>

        {displayError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700 border border-red-200">
            <AlertCircle size={16} />
            {displayError}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={16} />
            PIN actualizado correctamente
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !pin || !confirm}
          className="w-full sm:w-auto rounded-2xl bg-amber-500 px-8 py-3.5 text-[14px] font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-xl active:scale-95 disabled:pointer-events-none disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isLoading ? <Spinner size="sm" /> : null}
          {hasPinSet ? 'Actualizar PIN' : 'Crear PIN Maestro'}
        </button>
      </form>

      {/* Modules List */}
      <div className="pt-8 mt-2 border-t border-black/[0.04]">
        <h3 className="text-[16px] font-black text-neutral-900 mb-1">Cerrar pantallas con candado</h3>
        <p className="text-[13.5px] text-neutral-500 mb-6">Selecciona qué pantallas requerirán el PIN anterior para poder entrar.</p>

        {!hasPinSet && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] font-medium text-amber-800">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Primero crea tu PIN maestro arriba. Sin un PIN configurado, el candado no se activa y todas las pantallas quedan abiertas.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map(module => {
            const isLocked = localLocked.includes(module.id)
            return (
              <label 
                key={module.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-300",
                  isLocked 
                     ? "border-amber-400 bg-amber-50/30 shadow-sm" 
                     : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                )}
              >
                <div className="mt-0.5 relative flex items-center justify-center">
                   <input
                     type="checkbox"
                     checked={isLocked}
                     onChange={() => handleToggleModule(module.id)}
                     className="peer sr-only"
                   />
                   <div className={cn(
                     "h-5 w-5 rounded-md border-2 transition-colors flex items-center justify-center",
                     isLocked ? "border-amber-500 bg-amber-500" : "border-neutral-300 bg-white"
                   )}>
                      {isLocked && <CheckCircle2 size={12} className="text-white" />}
                   </div>
                </div>
                <span className={cn("text-[13.5px] font-bold leading-tight", isLocked ? "text-amber-900" : "text-neutral-700")}>
                  {module.label}
                </span>
              </label>
            )
          })}
        </div>

        {(localLocked.includes('dashboard') || localLocked.includes('settings')) && (
          <div className="mt-6 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] font-medium text-amber-800">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              Vas a bloquear {localLocked.includes('settings') ? <><strong>Configuración</strong> (esta pantalla)</> : <strong>el Panel de Control</strong>}: te pedirá el PIN cada vez que entres. Si lo olvidas, usa <strong>“¿Olvidaste el PIN?”</strong> en la pantalla de bloqueo para restablecerlo con tu cuenta (correo o Google).
            </span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4 border-t border-black/[0.04] pt-6">
          <button
            type="button"
            onClick={() => { void handleSaveModules() }}
            disabled={!hasModuleChanges || isUpdatingModules}
            className="rounded-2xl bg-black px-8 py-3 text-[14px] font-black text-white transition-all hover:bg-neutral-800 hover:shadow-lg active:scale-95 disabled:pointer-events-none disabled:opacity-30"
          >
            {isUpdatingModules ? <Spinner size="sm" /> : 'Guardar Pantallas'}
          </button>
          {modulesSuccess && (
            <span className="flex items-center gap-2 text-[13px] font-bold text-emerald-600">
              <CheckCircle2 size={16} /> Guardado
            </span>
          )}
        </div>
      </div>
    </div>
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
      // Need to hash the staff PIN as well if that's what setStaffPin expects, but let's check StaffAccountService.setStaffPin
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
    <div className="space-y-6 rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4 border-b border-black/[0.04] pb-6">
         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
           <Smartphone size={24} />
         </div>
         <div>
            <h2 className="text-lg font-black text-neutral-900 tracking-tight">Cuenta de Staff (Móvil)</h2>
            <p className="text-[13.5px] text-neutral-500 mt-1">Acceso independiente para tus meseros al comandero y menú digital desde sus teléfonos.</p>
         </div>
      </div>

      <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-5">
        <div className="rounded-2xl bg-blue-50/50 border border-blue-100/50 p-4">
           <div className="flex flex-col gap-2">
             <p className="text-[13.5px] font-medium text-blue-900/80 leading-relaxed">
               Pide a tu equipo que ingrese a:
             </p>
             <code className="inline-block w-fit rounded-xl bg-blue-100 px-3 py-2 text-[14px] font-black text-blue-800 select-all border border-blue-200/60 shadow-sm">
               {staffUrl}
             </code>
             <p className="text-[13px] text-blue-800/70 mt-1">
               Escribirán este PIN para entrar. Ellos no verán ventas ni configuraciones, solo tomarán órdenes y verán la disponibilidad.
             </p>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-[13px] font-bold uppercase tracking-wider text-neutral-500" htmlFor="staff-pin">PIN de acceso (6–8 dígitos)</label>
            <div className="relative">
              <input
                id="staff-pin"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                autoComplete="off"
                placeholder="Ej. 123456"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 pr-12 text-[15px] font-bold outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-bold uppercase tracking-wider text-neutral-500" htmlFor="staff-pin-confirm">Confirmar PIN</label>
            <div className="relative">
              <input
                id="staff-pin-confirm"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                autoComplete="off"
                placeholder="Repítelo"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 text-[15px] font-bold outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700 border border-red-200">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={16} />
            PIN de staff configurado correctamente.
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !pin || !confirm}
          className="w-full sm:w-auto rounded-2xl bg-blue-600 px-8 py-3.5 text-[14px] font-black text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl active:scale-95 disabled:pointer-events-none disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isLoading ? <Spinner size="sm" /> : null}
          Configurar PIN Móvil
        </button>
      </form>
    </div>
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
    success: profileSuccess,
  } = useUpdateProfile(tenantId)

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    await updateProfile(values)
  }

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <SettingsHeader />

      <div className="flex flex-col lg:flex-row gap-8 mt-2">
        
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          {TABS.map(({ key, label, icon: Icon, description }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                'group flex flex-col items-start gap-1 rounded-3xl p-4 text-left transition-all duration-300',
                activeTab === key
                  ? 'bg-neutral-900 text-white shadow-xl shadow-neutral-900/10'
                  : 'bg-transparent text-neutral-600 hover:bg-neutral-100/80',
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={18} className={activeTab === key ? "text-neutral-300" : "text-neutral-400 group-hover:text-neutral-600"} />
                <span className={cn("text-[14.5px] font-black", activeTab === key ? "text-white" : "text-neutral-800")}>
                   {label}
                </span>
              </div>
              <span className={cn("text-[12.5px] font-medium leading-relaxed pl-[28px]", activeTab === key ? "text-neutral-400" : "text-neutral-500")}>
                {description}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && tenant && (
            <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
               <div className="flex items-center gap-3 border-b border-black/[0.04] pb-6 mb-6">
                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 border border-neutral-200">
                   <UserCircle size={24} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-neutral-900 tracking-tight">Perfil de {tenant.name}</h2>
                    <p className="text-[13.5px] text-neutral-500 mt-1">Configura el nombre público, redes sociales y logotipo de tu menú.</p>
                 </div>
              </div>
              <ProfileForm
                tenant={tenant}
                isLoading={isProfileLoading}
                error={profileError}
                success={profileSuccess}
                onSubmit={(values) => { void handleProfileSubmit(values) }}
              />
            </div>
          )}
          
          {activeTab === 'plan' && tenant && (
            <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-black/[0.04] pb-6 mb-6">
                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                   <CreditCard size={24} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-neutral-900 tracking-tight">Datos de Suscripción</h2>
                    <p className="text-[13.5px] text-neutral-500 mt-1">Resumen rápido de los límites de tu cuenta y plan activo.</p>
                 </div>
              </div>
              <PlanInfo tenant={tenant} />
            </div>
          )}
          
          {activeTab === 'employees' && (
            <div className="flex flex-col gap-6">
              <StaffAccountSection tenantId={tenantId} />
              
              <EmployeePinSection
                tenantId={tenantId}
                hasPinSet={!!tenant?.employeePinHash}
                lockedModules={tenant?.lockedModules ?? []}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
