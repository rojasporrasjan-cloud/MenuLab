import type { Tenant } from '@core/domain/entities/Tenant'
import { sha256 } from '@shared/utils/sha256'

import { EmployeeService } from '@features/employees'

export interface POSAuthResult {
  readonly ok: boolean
  readonly employeeName: string
  readonly employeeId: string | null
}

const OWNER_FALLBACK_NAME = 'Dueño'

/**
 * Validación del PIN del POS:
 * 1. Contra los empleados activos del tenant (colección employees).
 * 2. Fallback: hash del tenant (tenant.employeePinHash) para el owner
 *    cuando aún no hay empleados creados.
 */
export const POSAuthService = {
  async validatePin(tenant: Tenant, pin: string): Promise<POSAuthResult> {
    const pinHash = await sha256(pin)

    // 1) Empleados activos con permiso de POS.
    const employee = await EmployeeService.validatePin.execute(tenant.id, pinHash)
    if (employee) {
      return { ok: true, employeeName: employee.name, employeeId: employee.id }
    }

    // 2) Fallback al PIN del tenant (owner).
    if (tenant.employeePinHash && tenant.employeePinHash === pinHash) {
      return { ok: true, employeeName: OWNER_FALLBACK_NAME, employeeId: null }
    }

    return { ok: false, employeeName: '', employeeId: null }
  },
} as const
