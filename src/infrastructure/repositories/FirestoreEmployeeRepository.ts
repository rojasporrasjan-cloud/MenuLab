import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { EmployeeMapper } from '@infrastructure/mappers/EmployeeMapper'
import type {
  EmployeeUpdate,
  IEmployeeRepository,
} from '@core/domain/repositories/IEmployeeRepository'
import type { Employee, NewEmployee } from '@core/domain/entities/Employee'
import { NotFoundError } from '@core/errors/NotFoundError'

/**
 * Colección: tenants/{tenantId}/employees
 * El aislamiento multi-tenant está garantizado por el path de la subcolección.
 */
export class FirestoreEmployeeRepository implements IEmployeeRepository {
  async list(tenantId: string): Promise<Employee[]> {
    const q = query(
      collection(db, firestorePaths.employees(tenantId)),
      orderBy('name', 'asc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => EmployeeMapper.toDomain(d, tenantId))
  }

  async create(employee: NewEmployee): Promise<Employee> {
    const ref = await addDoc(collection(db, firestorePaths.employees(employee.tenantId)), {
      ...employee,
      permissions: [...employee.permissions],
      createdAt: serverTimestamp(),
    })
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new NotFoundError('Employee', ref.id)
    return EmployeeMapper.toDomain(snap, employee.tenantId)
  }

  async update(tenantId: string, employeeId: string, changes: EmployeeUpdate): Promise<void> {
    const payload: Record<string, unknown> = {}
    if (changes.name !== undefined) payload['name'] = changes.name
    if (changes.role !== undefined) payload['role'] = changes.role
    if (changes.isActive !== undefined) payload['isActive'] = changes.isActive
    if (changes.permissions !== undefined) payload['permissions'] = [...changes.permissions]
    if (changes.pin !== undefined) payload['pin'] = changes.pin
    await updateDoc(doc(db, firestorePaths.employee(tenantId, employeeId)), payload)
  }

  async findActiveByPin(tenantId: string, pin: string): Promise<Employee | null> {
    const q = query(
      collection(db, firestorePaths.employees(tenantId)),
      where('isActive', '==', true),
    )
    const snap = await getDocs(q)
    const { verifyPin } = await import('@shared/utils/crypto')
    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      if (await verifyPin(pin, data.pin)) {
        return EmployeeMapper.toDomain(docSnap, tenantId)
      }
    }
    return null
  }
}
