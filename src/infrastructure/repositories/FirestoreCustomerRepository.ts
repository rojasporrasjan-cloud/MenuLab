import {
  collection,
  doc,
  getDoc,
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
    const existing = await getDoc(ref)

    if (existing.exists()) {
      await setDoc(
        ref,
        {
          name: snapshot.name || existing.data()['name'] || '',
          totalOrders: increment(1),
          totalSpent: increment(snapshot.subtotal),
          currency: snapshot.currency,
          lastOrderAt: serverTimestamp(),
        },
        { merge: true },
      )
      return
    }

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
