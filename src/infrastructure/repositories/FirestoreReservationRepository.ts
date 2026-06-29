import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { ReservationMapper } from '@infrastructure/mappers/ReservationMapper'
import type { IReservationRepository } from '@core/domain/repositories/IReservationRepository'
import type {
  NewReservation,
  Reservation,
  ReservationStatus,
} from '@core/domain/entities/Reservation'
import { NotFoundError } from '@core/errors/NotFoundError'

/**
 * Colección: tenants/{tenantId}/reservations
 * Índice compuesto requerido: reservations — date (ASC) + time (ASC).
 * Multi-tenant: el aislamiento lo garantiza el path de la subcolección.
 */
export class FirestoreReservationRepository implements IReservationRepository {
  async create(reservation: NewReservation): Promise<Reservation> {
    const ref = await addDoc(collection(db, firestorePaths.reservations(reservation.tenantId)), {
      ...reservation,
      createdAt: serverTimestamp(),
    })
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new NotFoundError('Reservation', ref.id)
    return ReservationMapper.toDomain(snap, reservation.tenantId)
  }

  async listByDate(tenantId: string, date: string): Promise<Reservation[]> {
    const q = query(
      collection(db, firestorePaths.reservations(tenantId)),
      where('date', '==', date)
    )
    const snap = await getDocs(q)
    const mapped = snap.docs.map((d) => ReservationMapper.toDomain(d, tenantId))
    mapped.sort((a, b) => a.time.localeCompare(b.time))
    return mapped
  }

  async updateStatus(
    tenantId: string,
    reservationId: string,
    status: ReservationStatus,
  ): Promise<void> {
    await updateDoc(doc(db, firestorePaths.reservation(tenantId, reservationId)), { status })
  }

  async update(
    tenantId: string,
    reservationId: string,
    data: Partial<NewReservation>,
  ): Promise<void> {
    // Aseguramos de no meter undefineds a Firestore
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined))
    await updateDoc(doc(db, firestorePaths.reservation(tenantId, reservationId)), cleanData)
  }
}
