import type { Employee, NewEmployee } from '../entities/Employee'

export interface EmployeeUpdate {
  readonly name?: string
  readonly role?: Employee['role']
  readonly isActive?: boolean
  readonly permissions?: readonly Employee['permissions'][number][]
  /** Hash SHA-256 del nuevo PIN (reset). */
  readonly pin?: string
}

export interface IEmployeeRepository {
  list(tenantId: string): Promise<Employee[]>
  create(employee: NewEmployee): Promise<Employee>
  update(tenantId: string, employeeId: string, changes: EmployeeUpdate): Promise<void>
  /** Empleado activo cuyo hash de PIN coincide, o null. */
  findActiveByPin(tenantId: string, pin: string): Promise<Employee | null>
}
