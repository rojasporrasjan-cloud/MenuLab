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
import { CashSessionMapper } from '@infrastructure/mappers/CashSessionMapper'
import type { ICashSessionRepository } from '@core/domain/repositories/ICashSessionRepository'
import type { CashSession, CashSessionClose, NewCashSession } from '@core/domain/entities/CashSession'
import { CASH_SESSION_STATUS } from '@core/domain/entities/CashSession'
import { NotFoundError } from '@core/errors/NotFoundError'

/**
 * Colección: tenants/{tenantId}/cashSessions
 * El aislamiento multi-tenant lo garantiza el path de la subcolección.
 */
export class FirestoreCashSessionRepository implements ICashSessionRepository {
  async create(session: NewCashSession): Promise<CashSession> {
    const ref = await addDoc(collection(db, firestorePaths.cashSessions(session.tenantId)), {
      tenantId: session.tenantId,
      status: CASH_SESSION_STATUS.open,
      openingAmount: session.openingAmount,
      openedBy: session.openedBy,
      openedAt: serverTimestamp(),
      closedBy: null,
      closedAt: null,
      countedCash: null,
      totals: null,
      expectedCash: null,
      difference: null,
      note: null,
    })
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new NotFoundError('CashSession', ref.id)
    return CashSessionMapper.toDomain(snap, session.tenantId)
  }

  async findOpen(tenantId: string): Promise<CashSession | null> {
    const q = query(
      collection(db, firestorePaths.cashSessions(tenantId)),
      where('status', '==', CASH_SESSION_STATUS.open),
      limit(1),
    )
    const snap = await getDocs(q)
    const first = snap.docs[0]
    return first ? CashSessionMapper.toDomain(first, tenantId) : null
  }

  async close(tenantId: string, sessionId: string, data: CashSessionClose): Promise<void> {
    await updateDoc(doc(db, firestorePaths.cashSession(tenantId, sessionId)), {
      status: CASH_SESSION_STATUS.closed,
      closedBy: data.closedBy,
      closedAt: serverTimestamp(),
      countedCash: data.countedCash,
      totals: data.totals,
      expectedCash: data.expectedCash,
      difference: data.difference,
      note: data.note,
    })
  }

  async listRecent(tenantId: string, max: number): Promise<CashSession[]> {
    const q = query(
      collection(db, firestorePaths.cashSessions(tenantId)),
      orderBy('openedAt', 'desc'),
      limit(max),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => CashSessionMapper.toDomain(d, tenantId))
  }
}
