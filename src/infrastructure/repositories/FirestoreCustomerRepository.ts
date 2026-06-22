import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { CustomerMapper } from '@infrastructure/mappers/CustomerMapper'
import type {
  CustomerOrderSnapshot,
  ICustomerRepository,
} from '@core/domain/repositories/ICustomerRepository'
import type { Customer } from '@core/domain/entities/Customer'

/**
 * Colección: tenants/{tenantId}/customers — id del doc = teléfono normalizado.
 * El upsert es determinista por teléfono: nunca duplica clientes.
 * Multi-tenant: el aislamiento lo garantiza el path de la subcolección.
 */
export class FirestoreCustomerRepository implements ICustomerRepository {
  async upsertFromOrder(snapshot: CustomerOrderSnapshot): Promise<void> {
    const ref = doc(db, firestorePaths.customer(snapshot.tenantId, snapshot.phone))
    
    try {
      // 1. Intentamos actualizar el cliente existente.
      // Esto funcionará porque las reglas de seguridad permiten `update` si no se cambian `tenantId` ni `phone`.
      // Si el cliente no existe, fallará (permission-denied o not-found).
      await updateDoc(ref, {
        name: snapshot.name,
        totalOrders: increment(1),
        totalSpent: increment(snapshot.subtotal),
        currency: snapshot.currency,
        lastOrderAt: serverTimestamp(),
      })
    } catch (_error) {
      // 2. Si falló, asumimos que no existe y lo creamos.
      // Las reglas de seguridad permiten `create` libremente si el `tenantId` coincide.
      await setDoc(ref, {
        tenantId: snapshot.tenantId,
        phone: snapshot.phone,
        name: snapshot.name,
        email: null,
        totalOrders: 1,
        totalSpent: snapshot.subtotal,
        currency: snapshot.currency,
        tags: [],
        note: null,
        firstOrderAt: serverTimestamp(),
        lastOrderAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
    }
  }

  async list(tenantId: string): Promise<Customer[]> {
    const q = query(
      collection(db, firestorePaths.customers(tenantId)),
      orderBy('lastOrderAt', 'desc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => CustomerMapper.toDomain(d, tenantId))
  }

  async updateNote(tenantId: string, customerId: string, note: string | null): Promise<void> {
    await updateDoc(doc(db, firestorePaths.customer(tenantId, customerId)), { note })
  }
}
