import type { Employee } from '@core/domain/entities/Employee'
import type { IEmployeeRepository } from '@core/domain/repositories/IEmployeeRepository'

export class ListEmployeesUseCase {
  private readonly employeeRepository: IEmployeeRepository

  constructor(employeeRepository: IEmployeeRepository) {
    this.employeeRepository = employeeRepository
  }

  async execute(tenantId: string): Promise<Employee[]> {
    return this.employeeRepository.list(tenantId)
  }
}
