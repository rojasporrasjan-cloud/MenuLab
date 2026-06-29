import type { Employee } from '@core/domain/entities/Employee'
import type { IEmployeeRepository } from '@core/domain/repositories/IEmployeeRepository'

/**
 * Devuelve el empleado activo cuyo PIN (hash) coincide, o null.
 * El hashing ocurre en la capa de UI/servicio — aquí solo se compara.
 */
export class ValidateEmployeePinUseCase {
  private readonly employeeRepository: IEmployeeRepository

  constructor(employeeRepository: IEmployeeRepository) {
    this.employeeRepository = employeeRepository
  }

  async execute(tenantId: string, pin: string): Promise<Employee | null> {
    if (!tenantId || !pin) return null
    return this.employeeRepository.findActiveByPin(tenantId, pin)
  }
}
