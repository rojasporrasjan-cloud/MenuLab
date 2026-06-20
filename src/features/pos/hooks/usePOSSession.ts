import { useCallback, useEffect, useState } from 'react'

import type { Tenant } from '@core/domain/entities/Tenant'
import { COPY } from '@shared/copy/ui.copy'

import { POSAuthService } from '../services/POSAuthService'
import type { POSSessionData } from '../types/pos.types'

const SESSION_KEY_PREFIX = 'pos-session'

function sessionKey(tenantId: string): string {
  return `${SESSION_KEY_PREFIX}-${tenantId}`
}

function readSession(tenantId: string): POSSessionData | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(tenantId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as POSSessionData).employeeName === 'string' // safe: validación estructural progresiva del JSON
    ) {
      return parsed as POSSessionData // safe: validado estructuralmente arriba
    }
    return null
  } catch {
    return null
  }
}

interface UsePOSSessionResult {
  readonly session: POSSessionData | null
  readonly isValidating: boolean
  readonly error: string | null
  readonly unlock: (pin: string) => Promise<boolean>
  readonly lock: () => void
}

/**
 * Sesión del POS: bloqueada hasta validar PIN (empleados activos primero,
 * fallback tenant.employeePinHash). Persistida en sessionStorage por tenant.
 */
export function usePOSSession(tenant: Tenant | null): UsePOSSessionResult {
  const tenantId = tenant?.id ?? ''
  const [session, setSession] = useState<POSSessionData | null>(() =>
    tenantId ? readSession(tenantId) : null,
  )
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sincronizar la caché offline apenas cargue la sesión o cambie el tenant.
  useEffect(() => {
    if (tenantId) {
      POSAuthService.syncCache(tenantId).catch(() => {})
    }
  }, [tenantId])

  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!tenant) return false
      setIsValidating(true)
      setError(null)
      try {
        const result = await POSAuthService.validatePin(tenant, pin)
        if (!result.ok) {
          setError(COPY.pos.pin.error)
          return false
        }
        const data: POSSessionData = {
          employeeName: result.employeeName,
          employeeId: result.employeeId,
          unlockedAt: Date.now(),
        }
        sessionStorage.setItem(sessionKey(tenant.id), JSON.stringify(data))
        setSession(data)
        return true
      } catch {
        setError(COPY.errors.generic)
        return false
      } finally {
        setIsValidating(false)
      }
    },
    [tenant],
  )

  const lock = useCallback(() => {
    if (tenantId) sessionStorage.removeItem(sessionKey(tenantId))
    setSession(null)
  }, [tenantId])

  return { session, isValidating, error, unlock, lock }
}
