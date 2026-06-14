import { describe, it, expect } from 'vitest'
import { employeeHasPermission, EMPLOYEE_PERMISSION, DEFAULT_PERMISSIONS_BY_ROLE } from './Employee'
import type { Employee } from './Employee'

function emp(p: Partial<Employee>): Employee {
  return {
    id: 'e', tenantId: 't1', name: 'X', pin: 'hash', role: 'cashier',
    isActive: true, permissions: [EMPLOYEE_PERMISSION.accessPos], createdAt: new Date(),
    ...p,
  }
}

describe('employeeHasPermission', () => {
  it('true si está activo y tiene el permiso', () => {
    expect(employeeHasPermission(
      emp({ permissions: [EMPLOYEE_PERMISSION.accessPos] }),
      EMPLOYEE_PERMISSION.accessPos,
    )).toBe(true)
  })
  it('false si no tiene el permiso', () => {
    expect(employeeHasPermission(
      emp({ permissions: [EMPLOYEE_PERMISSION.viewOrders] }),
      EMPLOYEE_PERMISSION.manageMenu,
    )).toBe(false)
  })
  it('false si está inactivo aunque tenga el permiso', () => {
    expect(employeeHasPermission(
      emp({ isActive: false, permissions: [EMPLOYEE_PERMISSION.accessPos] }),
      EMPLOYEE_PERMISSION.accessPos,
    )).toBe(false)
  })
})

describe('DEFAULT_PERMISSIONS_BY_ROLE', () => {
  it('owner tiene todos los permisos (incluye gestionar empleados)', () => {
    expect(DEFAULT_PERMISSIONS_BY_ROLE.owner).toContain(EMPLOYEE_PERMISSION.manageEmployees)
  })
  it('manager NO puede gestionar empleados', () => {
    expect(DEFAULT_PERMISSIONS_BY_ROLE.manager).not.toContain(EMPLOYEE_PERMISSION.manageEmployees)
  })
  it('kitchen solo gestiona pedidos', () => {
    expect(DEFAULT_PERMISSIONS_BY_ROLE.kitchen).toEqual([EMPLOYEE_PERMISSION.manageOrders])
  })
})
