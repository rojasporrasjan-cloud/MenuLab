import type { Tenant } from '@core/domain/entities/Tenant'
import { verifyPin, hashPin } from '@shared/utils/crypto'

import { EmployeeService } from '@features/employees'

export interface POSAuthResult {
  readonly ok: boolean
  readonly employeeName: string
  readonly employeeId: string | null
  readonly role?: string
  readonly permissions?: readonly string[]
}

const OWNER_FALLBACK_NAME = 'Dueño'
const POS_AUTH_CACHE_KEY_PREFIX = 'pos-auth-cache-'

/**
 * Validación del PIN del POS (Offline-First):
 * 1. Fallback: hash del tenant (tenant.employeePinHash) para el owner.
 * 2. Caché local: empleados activos guardados en localStorage.
 * 3. Base de datos viva: como último recurso.
 */
export const POSAuthService = {
  async syncCache(tenantId: string): Promise<void> {
    if (!tenantId) return
    try {
      const employees = await EmployeeService.listEmployees.execute(tenantId)
      const active = employees.filter((e) => e.isActive)
      const cacheData = active.map((e) => ({ 
        id: e.id, 
        name: e.name, 
        pin: e.pin,
        role: e.role,
        permissions: e.permissions
      }))
      localStorage.setItem(`${POS_AUTH_CACHE_KEY_PREFIX}${tenantId}`, JSON.stringify(cacheData))
    } catch {
      // Falla silenciosa si no hay internet (mantiene la caché anterior)
    }
  },

  async validatePin(tenant: Tenant, pin: string): Promise<POSAuthResult> {
    // 1) Fallback al PIN del tenant (owner). Sincrónico e inmediato.
    if (tenant.employeePinHash && await verifyPin(pin, tenant.employeePinHash)) {
      // Owner fallback bypass
      return { 
        ok: true, 
        employeeName: OWNER_FALLBACK_NAME, 
        employeeId: null,
        role: 'owner',
        permissions: ['access_pos', 'manage_orders', 'view_orders', 'view_analytics', 'manage_menu', 'manage_inventory', 'manage_employees', 'view_reports', 'manage_reservations', 'view_reservations']
      }
    }

    // 2) Caché local (Offline-first)
    try {
      const rawCache = localStorage.getItem(`${POS_AUTH_CACHE_KEY_PREFIX}${tenant.id}`)
      if (rawCache) {
        const cached = JSON.parse(rawCache) as Array<{ id: string; name: string; pin: string; role?: string; permissions?: readonly string[] }>
        for (const e of cached) {
          if (await verifyPin(pin, e.pin)) {
            return { 
              ok: true, 
              employeeName: e.name, 
              employeeId: e.id,
              role: e.role,
              permissions: e.permissions
            }
          }
        }
      }
    } catch {
      // Ignorar errores de parseo y continuar con la BD
    }

    // 3) Base de datos viva (por si es un empleado recién creado)
    try {
      const employee = await EmployeeService.validatePin.execute(tenant.id, pin)
      if (employee) {
        return { 
          ok: true, 
          employeeName: employee.name, 
          employeeId: employee.id,
          role: employee.role,
          permissions: employee.permissions
        }
      }
    } catch {
      // Ignorar errores de red si estaba offline
    }

    return { ok: false, employeeName: '', employeeId: null }
  },
} as const
