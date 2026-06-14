import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { InvoiceMapper } from '@infrastructure/mappers/InvoiceMapper'
import type { IInvoiceRepository } from '@core/domain/repositories/IInvoiceRepository'
import type { Invoice, NewInvoice, InvoiceStatus } from '@core/domain/entities/Invoice'

export class FirestoreInvoiceRepository implements IInvoiceRepository {
  async create(invoice: NewInvoice): Promise<Invoice> {
    const ref = doc(collection(db, firestorePaths.invoices(invoice.tenantId)))
    await setDoc(ref, { ...invoice, createdAt: serverTimestamp() })
    const snap = await getDoc(ref)
    return InvoiceMapper.toDomain(snap, invoice.tenantId)
  }

  async getById(tenantId: string, invoiceId: string): Promise<Invoice | null> {
    const snap = await getDoc(doc(db, firestorePaths.invoice(tenantId, invoiceId)))
    return snap.exists() ? InvoiceMapper.toDomain(snap, tenantId) : null
  }

  async listRecent(tenantId: string, max: number): Promise<Invoice[]> {
    const q = query(
      collection(db, firestorePaths.invoices(tenantId)),
      orderBy('issuedAt', 'desc'),
      limit(max),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => InvoiceMapper.toDomain(d, tenantId))
  }

  async count(tenantId: string): Promise<number> {
    const snap = await getCountFromServer(collection(db, firestorePaths.invoices(tenantId)))
    return snap.data().count
  }

  async updateStatus(
    tenantId: string,
    invoiceId: string,
    status: InvoiceStatus,
    haciendaResponse: string | null,
  ): Promise<void> {
    await updateDoc(doc(db, firestorePaths.invoice(tenantId, invoiceId)), { status, haciendaResponse })
  }
}
