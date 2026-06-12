import { useQuery } from '@tanstack/react-query'

import { ReservationService } from '../services/ReservationService'
import { reservationQueryKeys } from '../types/reservations.types'

const RESERVATIONS_STALE_MS = 1000 * 30

/** Reservas de un día concreto (YYYY-MM-DD) para el panel del admin. */
export function useReservationsByDate(tenantId: string, date: string) {
  return useQuery({
    queryKey: reservationQueryKeys.byDate(tenantId, date),
    queryFn: () => ReservationService.listReservationsByDate.execute(tenantId, date),
    enabled: Boolean(tenantId) && Boolean(date),
    staleTime: RESERVATIONS_STALE_MS,
  })
}
