export const EMPLOYEE_ROLE = {
  owner: 'owner',
  manager: 'manager',
  cashier: 'cashier',
  waiter: 'waiter',
  kitchen: 'kitchen',
} as const

export type EmployeeRole = (typeof EMPLOYEE_ROLE)[keyof typeof EMPLOYEE_ROLE]

export const EMPLOYEE_PERMISSION = {
  viewOrders: 'view_orders',
  manageOrders: 'manage_orders',
  viewReservations: 'view_reservations',
  manageReservations: 'manage_reservations',
  viewAnalytics: 'view_analytics',
  manageMenu: 'manage_menu',
  manageInventory: 'manage_inventory',
  manageEmployees: 'manage_employees',
  viewReports: 'view_reports',
  accessPos: 'access_pos',
} as const

export type EmployeePermission = (typeof EMPLOYEE_PERMISSION)[keyof typeof EMPLOYEE_PERMISSION]

export interface Employee {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  /** Hash SHA-256 del PIN de 4 dígitos — nunca el PIN en claro. */
  readonly pin: string
  readonly role: EmployeeRole
  readonly isActive: boolean
  readonly permissions: readonly EmployeePermission[]
  readonly createdAt: Date
}

export type NewEmployee = Omit<Employee, 'id' | 'createdAt'>

const ALL_PERMISSIONS: readonly EmployeePermission[] = Object.values(EMPLOYEE_PERMISSION)

/** Permisos por defecto al crear un empleado según su rol. */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<EmployeeRole, readonly EmployeePermission[]> = {
  owner: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS.filter((p) => p !== EMPLOYEE_PERMISSION.manageEmployees),
  cashier: [
    EMPLOYEE_PERMISSION.manageOrders,
    EMPLOYEE_PERMISSION.accessPos,
    EMPLOYEE_PERMISSION.viewReports,
  ],
  waiter: [
    EMPLOYEE_PERMISSION.viewOrders,
    EMPLOYEE_PERMISSION.manageOrders,
    EMPLOYEE_PERMISSION.accessPos,
  ],
  kitchen: [EMPLOYEE_PERMISSION.manageOrders],
}

export function employeeHasPermission(
  employee: Employee,
  permission: EmployeePermission,
): boolean {
  return employee.isActive && employee.permissions.includes(permission)
}
