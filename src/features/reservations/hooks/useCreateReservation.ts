import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { NewReservation, Reservation } from '@core/domain/entities/Reservation'

import { ReservationService } from '../services/ReservationService'
import { reservationQueryKeys } from '../types/reservations.types'

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation<Reservation, Error, NewReservation>({
    mutationFn: (input) => ReservationService.createReservation.execute(input),
    onSuccess: (reservation) => {
      void queryClient.invalidateQueries({
        queryKey: reservationQueryKeys.byDate(reservation.tenantId, reservation.date),
      })
    },
  })
}
