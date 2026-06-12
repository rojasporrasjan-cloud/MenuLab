import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { OrderStatus } from '@core/domain/entities/Order'
import { OrderService } from '../services/OrderService'
import { orderQueryKeys } from '../types/cart.types'

interface UpdateOrderStatusInput {
  readonly tenantId: string
  readonly orderId: string
  readonly status: OrderStatus
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateOrderStatusInput>({
    mutationFn: ({ tenantId, orderId, status }) =>
      OrderService.updateOrderStatus.execute(tenantId, orderId, status),
    onSuccess: (_data, { tenantId }) => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.active(tenantId) })
    },
  })
}
