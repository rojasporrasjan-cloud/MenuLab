import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CloseCheckInput } from '@core/use-cases/pos/CloseCheckUseCase'

import { POSService } from '../services/POSService'

/** Cierra la cuenta de una mesa: pagos + pedidos entregados. */
export function useCloseCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CloseCheckInput) => POSService.closeCheck.execute(input),
    onSuccess: (_, input) => {
      // Los pedidos activos llegan por onSnapshot; el historial por fecha se invalida.
      void queryClient.invalidateQueries({ queryKey: ['orders', input.tenantId] })
    },
  })
}
