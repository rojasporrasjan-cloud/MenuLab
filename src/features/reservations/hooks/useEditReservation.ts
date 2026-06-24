import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Reservation } from '@core/domain/entities/Reservation'
import type { UpdateReservationInput } from '@core/use-cases/reservation/UpdateReservationUseCase'
import { ReservationService } from '../services/ReservationService'
import { reservationQueryKeys } from '../types/reservations.types'

export function useEditReservation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateReservationInput>({
    mutationFn: (input) => ReservationService.updateReservation.execute(input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({
        queryKey: reservationQueryKeys.byDate(input.tenantId, input.date!),
      })
    },
  })
}
