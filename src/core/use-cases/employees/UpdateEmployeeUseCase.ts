import type { EmployeeUpdate, IEmployeeRepository } from '@core/domain/repositories/IEmployeeRepository'
import { ValidationError } from '@core/errors/ValidationError'

export class UpdateEmployeeUseCase {
  private readonly employeeRepository: IEmployeeRepository

  constructor(employeeRepository: IEmployeeRepository) {
    this.employeeRepository = employeeRepository
  }

  async execute(tenantId: string, employeeId: string, changes: EmployeeUpdate): Promise<void> {
    if (changes.name !== undefined && !changes.name.trim()) {
      throw new ValidationError('name', 'El empleado necesita un nombre.')
    }

    // Si cambia el PIN, no debe chocar con el de otro empleado activo.
    if (changes.pin) {
      const existing = await this.employeeRepository.findActiveByPinHash(tenantId, changes.pin)
      if (existing && existing.id !== employeeId) {
        throw new ValidationError('pin', 'Ese PIN ya está en uso por otro empleado.')
      }
    }

    await this.employeeRepository.update(tenantId, employeeId, changes)
  }
}
