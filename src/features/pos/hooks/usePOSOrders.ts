import { useMemo } from 'react'

import type { Order } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'
import { useActiveOrders } from '@features/cart'

import type { POSTableState } from '../types/pos.types'
import { POS_TABLE_STATE } from '../types/pos.types'

interface POSOrdersResult {
  readonly orders: Order[]
  readonly ordersByTable: Map<string, Order[]>
  readonly tableState: (tableId: string) => POSTableState
  readonly isLoading: boolean
}

/**
 * Pedidos activos en tiempo real agrupados por mesa, con el estado visual
 * de cada mesa: verde libre, naranja ocupada, rojo con pedido pendiente.
 */
export function usePOSOrders(tenantId: string): POSOrdersResult {
  const { orders, isLoading } = useActiveOrders(tenantId)

  const ordersByTable = useMemo(() => {
    const map = new Map<string, Order[]>()
    for (const order of orders) {
      if (!order.tableId) continue
      const existing = map.get(order.tableId) ?? []
      existing.push(order)
      map.set(order.tableId, existing)
    }
    return map
  }, [orders])

  function tableState(tableId: string): POSTableState {
    const tableOrders = ordersByTable.get(tableId)
    if (!tableOrders || tableOrders.length === 0) return POS_TABLE_STATE.free
    if (tableOrders.some((o) => o.status === ORDER_STATUS.pending)) {
      return POS_TABLE_STATE.pending
    }
    return POS_TABLE_STATE.occupied
  }

  return { orders, ordersByTable, tableState, isLoading }
}
