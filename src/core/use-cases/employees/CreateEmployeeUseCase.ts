import type { Employee, NewEmployee } from '@core/domain/entities/Employee'
import type { IEmployeeRepository } from '@core/domain/repositories/IEmployeeRepository'
import { ValidationError } from '@core/errors/ValidationError'

export class CreateEmployeeUseCase {
  private readonly employeeRepository: IEmployeeRepository

  constructor(employeeRepository: IEmployeeRepository) {
    this.employeeRepository = employeeRepository
  }

  async execute(input: NewEmployee): Promise<Employee> {
    if (!input.tenantId) {
      throw new ValidationError('tenantId', 'El empleado necesita un tenant.')
    }
    if (!input.name.trim()) {
      throw new ValidationError('name', 'El empleado necesita un nombre.')
    }
    if (!input.pin) {
      throw new ValidationError('pin', 'El empleado necesita un PIN.')
    }

    // El PIN debe ser único entre los empleados activos (es la credencial del POS).
    const existing = await this.employeeRepository.findActiveByPinHash(
      input.tenantId,
      input.pin,
    )
    if (existing) {
      throw new ValidationError('pin', 'Ese PIN ya está en uso por otro empleado.')
    }

    return this.employeeRepository.create({ ...input, name: input.name.trim() })
  }
}
