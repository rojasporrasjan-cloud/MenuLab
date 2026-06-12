import { useQuery } from '@tanstack/react-query'
import { OrderService } from '../services/OrderService'
import { orderQueryKeys } from '../types/cart.types'

/** Pedidos de un día concreto (YYYY-MM-DD) para el historial del admin. */
export function useOrdersByDate(tenantId: string, date: string) {
  return useQuery({
    queryKey: orderQueryKeys.byDate(tenantId, date),
    queryFn: () => OrderService.listOrdersByDate.execute(tenantId, date),
    enabled: Boolean(tenantId) && Boolean(date),
    staleTime: 1000 * 60,
  })
}
