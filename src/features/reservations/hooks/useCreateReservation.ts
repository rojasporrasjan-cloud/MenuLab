import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { NewReservation, Reservation } from '@core/domain/entities/Reservation'

import { ReservationService } from '../services/ReservationService'
import { reservationQueryKeys } from '../types/reservations.types'

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation<
    Reservation,
    Error,
    NewReservation,
    { previousReservations: Reservation[] | undefined; queryKey: readonly unknown[] }
  >({
    mutationFn: (input) => ReservationService.createReservation.execute(input),
    onMutate: async (newReservation) => {
      // 1. Cancelar queries en vuelo para que no sobrescriban nuestra actualización optimista
      const queryKey = reservationQueryKeys.byDate(newReservation.tenantId, newReservation.date)
      await queryClient.cancelQueries({ queryKey })

      // 2. Guardar el estado previo por si falla
      const previousReservations = queryClient.getQueryData<Reservation[]>(queryKey)

      // 3. Insertar la reserva optimista en la caché
      const optimisticReservation: Reservation = {
        ...newReservation,
        id: `temp-${Date.now()}`,
        note: newReservation.note ?? null,
        createdAt: new Date(),
      }

      queryClient.setQueryData<Reservation[]>(queryKey, (old = []) => {
        return [...old, optimisticReservation]
      })

      // 4. Retornar el contexto con los datos previos
      return { previousReservations, queryKey }
    },
    onError: (_err, _newReservation, context) => {
      // Si falla, restaurar la caché al estado previo
      if (context?.previousReservations) {
        queryClient.setQueryData(context.queryKey, context.previousReservations)
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      // Siempre invalidar al final para sincronizar con la fuente de verdad (Firestore)
      if (context?.queryKey) {
        void queryClient.invalidateQueries({ queryKey: context.queryKey })
      }
    },
  })
}
