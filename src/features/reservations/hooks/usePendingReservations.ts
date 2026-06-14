import { useEffect, useState } from 'react'

import type { Reservation } from '@core/domain/entities/Reservation'
import { ReservationRealtimeService } from '@infrastructure/services/ReservationRealtimeService'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'

interface PendingReservationsState {
  readonly reservations: Reservation[]
  readonly count: number
}

/**
 * Reservas pendientes en tiempo real — alimenta el badge del sidebar.
 * Multi-tenant: la suscripción siempre va bajo tenants/{tenantId}/reservations.
 */
export function usePendingReservations(tenantId: string): PendingReservationsState {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const enabled = Boolean(tenantId) && isFirebaseConfigured

  useEffect(() => {
    if (!enabled) return
    const unsubscribe = ReservationRealtimeService.subscribePending(
      tenantId,
      setReservations,
      () => setReservations([]),
    )
    return () => unsubscribe()
  }, [tenantId, enabled])

  // Sin tenant o sin Firebase: vacío derivado (sin setState en el efecto).
  if (!enabled) return { reservations: [], count: 0 }
  return { reservations, count: reservations.length }
}
