import { FirestoreEmployeeRepository } from '@infrastructure/repositories/FirestoreEmployeeRepository'
import { ListEmployeesUseCase } from '@core/use-cases/employees/ListEmployeesUseCase'
import { CreateEmployeeUseCase } from '@core/use-cases/employees/CreateEmployeeUseCase'
import { UpdateEmployeeUseCase } from '@core/use-cases/employees/UpdateEmployeeUseCase'
import { ValidateEmployeePinUseCase } from '@core/use-cases/employees/ValidateEmployeePinUseCase'

/**
 * Composition root del feature de empleados.
 * Singleton a nivel de módulo — mismo patrón que OrderService.
 */
const employeeRepository = new FirestoreEmployeeRepository()

export const EmployeeService = {
  listEmployees: new ListEmployeesUseCase(employeeRepository),
  createEmployee: new CreateEmployeeUseCase(employeeRepository),
  updateEmployee: new UpdateEmployeeUseCase(employeeRepository),
  validatePin: new ValidateEmployeePinUseCase(employeeRepository),
} as const
