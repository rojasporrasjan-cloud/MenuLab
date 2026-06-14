import { addDoc, collection, getDoc, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { PaymentMapper } from '@infrastructure/mappers/PaymentMapper'
import type { IPaymentRepository } from '@core/domain/repositories/IPaymentRepository'
import type { NewPayment, Payment } from '@core/domain/entities/Payment'
import { NotFoundError } from '@core/errors/NotFoundError'

/**
 * Colección: tenants/{tenantId}/payments
 * El aislamiento multi-tenant está garantizado por el path de la subcolección.
 */
export class FirestorePaymentRepository implements IPaymentRepository {
  async create(payment: NewPayment): Promise<Payment> {
    const ref = await addDoc(collection(db, firestorePaths.payments(payment.tenantId)), {
      ...payment,
      createdAt: serverTimestamp(),
    })
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new NotFoundError('Payment', ref.id)
    return PaymentMapper.toDomain(snap, payment.tenantId)
  }

  async listBetween(tenantId: string, start: Date, end: Date): Promise<Payment[]> {
    const q = query(
      collection(db, firestorePaths.payments(tenantId)),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'asc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => PaymentMapper.toDomain(d, tenantId))
  }
}
