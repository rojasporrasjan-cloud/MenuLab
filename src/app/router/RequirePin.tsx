import { useState } from 'react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { PinLockScreen } from '@shared/ui/components/PinLockScreen'

interface RequirePinProps {
  moduleId: string
  children: React.ReactNode
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

export function RequirePin({ moduleId, children }: RequirePinProps) {
  const { tenant } = useTenantContext()
  // Estado inicial derivado de sessionStorage (lazy init — sin useEffect).
  const [isUnlocked, setIsUnlocked] = useState(() => readUnlockedModules(moduleId))

  if (!tenant) return <>{children}</>

  const isModuleLocked = tenant.lockedModules?.includes(moduleId)
  const hasPinSet = Boolean(tenant.employeePinHash)

  // Si el módulo no está bloqueado, no hay PIN, o ya se desbloqueó en esta sesión.
  if (!isModuleLocked || !hasPinSet || isUnlocked) {
    return <>{children}</>
  }

  return (
    <PinLockScreen
      onUnlock={() => {
        setIsUnlocked(true)
        persistUnlockedModule(moduleId)
      }}
    />
  )
}
