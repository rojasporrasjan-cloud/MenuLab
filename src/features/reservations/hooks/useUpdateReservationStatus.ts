import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ReservationStatus } from '@core/domain/entities/Reservation'

import { ReservationService } from '../services/ReservationService'
import { reservationQueryKeys } from '../types/reservations.types'

interface UpdateReservationStatusInput {
  readonly tenantId: string
  readonly reservationId: string
  readonly date: string
  readonly status: ReservationStatus
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateReservationStatusInput>({
    mutationFn: ({ tenantId, reservationId, status }) =>
      ReservationService.updateReservationStatus.execute(tenantId, reservationId, status),
    onSuccess: (_data, { tenantId, date }) => {
      void queryClient.invalidateQueries({ queryKey: reservationQueryKeys.byDate(tenantId, date) })
    },
  })
}
