import { useState } from 'react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { PinLockScreen } from '@shared/ui/components/PinLockScreen'
import { PinRecovery } from '@features/settings/components/PinRecovery'

interface RequirePinProps {
  moduleId?: string
  children?: React.ReactNode
  onSuccess?: () => void
  onCancel?: () => void
}

export function RequirePin({ moduleId, children, onSuccess, onCancel }: RequirePinProps) {
  const { tenant } = useTenantContext()
  // El desbloqueo dura solo mientras la sección está montada: al salir y volver,
  // o al re-fijar la terminal, se exige el PIN de nuevo. No se persiste en sesión
  // (antes se guardaba en sessionStorage y quedaba abierto toda la sesión).
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)

  if (!tenant) return <>{children}</>

  const isModuleLocked = moduleId ? tenant.lockedModules?.includes(moduleId) : true
  const hasPinSet = Boolean(tenant.employeePinHash)

  const handleUnlock = () => {
    setShowRecovery(false)
    setIsUnlocked(true)
    if (onSuccess) onSuccess()
  }

  // Si el módulo no está bloqueado, no hay PIN, o ya se desbloqueó en esta visita.
  if (!isModuleLocked || !hasPinSet || isUnlocked) {
    return <>{children}</>
  }

  // Recuperación: el dueño re-autentica con su cuenta y define un PIN nuevo.
  // Es la única vía para no quedar encerrado cuando se bloquea Configuración.
  if (showRecovery) {
    return <PinRecovery onRecovered={handleUnlock} onBack={() => setShowRecovery(false)} />
  }

  return (
    <PinLockScreen
      onUnlock={handleUnlock}
      onCancel={onCancel}
      onForgotPin={() => setShowRecovery(true)}
    />
  )
}
