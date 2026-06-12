import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type {
  Employee,
  EmployeePermission,
  EmployeeRole,
} from '@core/domain/entities/Employee'
import { EMPLOYEE_PERMISSION, EMPLOYEE_ROLE } from '@core/domain/entities/Employee'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDateOrEpoch(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp con toDate()
  }
  return new Date(0)
}

function toRole(raw: unknown): EmployeeRole {
  const roles: readonly string[] = Object.values(EMPLOYEE_ROLE)
  return typeof raw === 'string' && roles.includes(raw)
    ? (raw as EmployeeRole) // safe: validado contra EMPLOYEE_ROLE en la línea anterior
    : EMPLOYEE_ROLE.waiter
}

function toPermissions(raw: unknown): EmployeePermission[] {
  if (!Array.isArray(raw)) return []
  const valid: readonly string[] = Object.values(EMPLOYEE_PERMISSION)
  return raw.filter(
    (p): p is EmployeePermission => typeof p === 'string' && valid.includes(p),
  )
}

export class EmployeeMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): Employee {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      name: String(data['name'] ?? ''),
      pin: String(data['pin'] ?? ''),
      role: toRole(data['role']),
      isActive: Boolean(data['isActive'] ?? true),
      permissions: toPermissions(data['permissions']),
      createdAt: toDateOrEpoch(data['createdAt']),
    }
  }
}
