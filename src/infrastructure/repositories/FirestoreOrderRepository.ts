import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { OrderMapper } from '@infrastructure/mappers/OrderMapper'
import type { IOrderRepository } from '@core/domain/repositories/IOrderRepository'
import type { NewOrder, Order, OrderStatus, PaymentStatus } from '@core/domain/entities/Order'
import { ACTIVE_ORDER_STATUSES } from '@core/domain/entities/Order'
import { NotFoundError } from '@core/errors/NotFoundError'

/**
 * Colección: tenants/{tenantId}/orders
 *
 * Índice compuesto requerido (firestore.indexes.json):
 *   collection: orders — fields: status (ASC), createdAt (DESC)
 *   collection: orders — fields: createdAt (ASC)  [single-field, automático]
 * El aislamiento multi-tenant está garantizado por el path de la subcolección.
 */
export class FirestoreOrderRepository implements IOrderRepository {
  async create(order: NewOrder): Promise<Order> {
    const ref = await addDoc(collection(db, firestorePaths.orders(order.tenantId)), {
      ...order,
      paymentStatus: 'pending', // Default payment status
      items: order.items.map((i) => ({ ...i })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new NotFoundError('Order', ref.id)
    return OrderMapper.toDomain(snap, order.tenantId)
  }

  async listActive(tenantId: string): Promise<Order[]> {
    const q = query(
      collection(db, firestorePaths.orders(tenantId)),
      where('status', 'in', [...ACTIVE_ORDER_STATUSES]),
      orderBy('createdAt', 'desc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => OrderMapper.toDomain(d, tenantId))
  }

  async listByDate(tenantId: string, date: string): Promise<Order[]> {
    const start = new Date(`${date}T00:00:00`)
    const end = new Date(`${date}T23:59:59.999`)
    const q = query(
      collection(db, firestorePaths.orders(tenantId)),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => OrderMapper.toDomain(d, tenantId))
  }

  async listRecent(tenantId: string, max: number): Promise<Order[]> {
    const q = query(
      collection(db, firestorePaths.orders(tenantId)),
      orderBy('createdAt', 'desc'),
      limit(max),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => OrderMapper.toDomain(d, tenantId))
  }

  async listBetween(tenantId: string, start: Date, end: Date): Promise<Order[]> {
    const q = query(
      collection(db, firestorePaths.orders(tenantId)),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => OrderMapper.toDomain(d, tenantId))
  }

  async updateStatus(tenantId: string, orderId: string, status: OrderStatus): Promise<void> {
    await updateDoc(doc(db, firestorePaths.order(tenantId, orderId)), {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  async updatePaymentStatus(tenantId: string, orderId: string, paymentStatus: PaymentStatus): Promise<void> {
    await updateDoc(doc(db, firestorePaths.order(tenantId, orderId)), {
      paymentStatus,
      updatedAt: serverTimestamp(),
    })
  }
}
