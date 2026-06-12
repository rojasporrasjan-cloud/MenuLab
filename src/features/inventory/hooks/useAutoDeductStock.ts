import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Order } from '@core/domain/entities/Order'

import { InventoryService } from '../services/InventoryService'

/**
 * Descuenta automáticamente el stock de un pedido según las recetas.
 *
 * ⚠️ Implementado pero NO conectado al flujo de órdenes todavía:
 * conectar cuando el negocio decida en qué estado del pedido descontar
 * (al confirmar vs. al entregar). Llamar con la orden completa.
 */
export function useAutoDeductStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (order: Order) => InventoryService.deductStockForOrder.execute(order),
    onSuccess: (_, order) => {
      void queryClient.invalidateQueries({ queryKey: ['inventory', order.tenantId] })
    },
  })
}
