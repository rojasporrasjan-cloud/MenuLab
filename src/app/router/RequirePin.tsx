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

const UNLOCKED_KEY = 'unlocked_modules'

function readUnlockedModules(moduleId: string): boolean {
  try {
    const raw = sessionStorage.getItem(UNLOCKED_KEY)
    if (!raw) return false
    const list: unknown = JSON.parse(raw)
    return Array.isArray(list) && list.includes(moduleId)
  } catch (e) {
    console.error('Failed to read unlocked_modules from sessionStorage', e)
    return false
  }
}

function persistUnlockedModule(moduleId: string): void {
  try {
    const raw = sessionStorage.getItem(UNLOCKED_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    if (!list.includes(moduleId)) list.push(moduleId)
    sessionStorage.setItem(UNLOCKED_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save unlocked_modules to sessionStorage', e)
  }
}

export function RequirePin({ moduleId, children, onSuccess, onCancel }: RequirePinProps) {
  const { tenant } = useTenantContext()
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return moduleId ? readUnlockedModules(moduleId) : false
  })
  const [showRecovery, setShowRecovery] = useState(false)

  if (!tenant) return <>{children}</>

  const isModuleLocked = moduleId ? tenant.lockedModules?.includes(moduleId) : true
  const hasPinSet = Boolean(tenant.employeePinHash)

  const handleUnlock = () => {
    if (moduleId) {
      persistUnlockedModule(moduleId)
    }
    setShowRecovery(false)
    setIsUnlocked(true)
    if (onSuccess) onSuccess()
  }

  // Si el módulo no está bloqueado, no hay PIN, o ya se desbloqueó en esta sesión.
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
