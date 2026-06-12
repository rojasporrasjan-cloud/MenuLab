import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { ReservationMapper } from '@infrastructure/mappers/ReservationMapper'
import type { Reservation } from '@core/domain/entities/Reservation'
import { RESERVATION_STATUS } from '@core/domain/entities/Reservation'

/**
 * Suscripciones en tiempo real a reservas (badge del sidebar + panel admin).
 * Multi-tenant: el path de la subcolección incluye siempre el tenantId.
 */
export const ReservationRealtimeService = {
  /** Reservas pendientes de confirmar (cualquier fecha). */
  subscribePending(
    tenantId: string,
    onReservations: (reservations: Reservation[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, firestorePaths.reservations(tenantId)),
      where('status', '==', RESERVATION_STATUS.pending),
    )
    return onSnapshot(
      q,
      (snap) => onReservations(snap.docs.map((d) => ReservationMapper.toDomain(d, tenantId))),
      (error) => onError?.(error),
    )
  },
} as const
