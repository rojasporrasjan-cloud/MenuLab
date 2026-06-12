import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NewOrder, Order } from '@core/domain/entities/Order'
import { OrderService } from '../services/OrderService'
import { orderQueryKeys } from '../types/cart.types'

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation<Order, Error, NewOrder>({
    mutationFn: (input) => OrderService.createOrder.execute(input),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.active(order.tenantId) })
    },
  })
}
