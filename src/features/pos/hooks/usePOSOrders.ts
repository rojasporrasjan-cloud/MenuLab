import { useMemo, useEffect, useRef } from 'react'

import { playNewOrderBeep } from '@shared/utils/beep'

import type { Order } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'
import { useActiveOrders } from '@features/cart'

import type { POSTableState } from '../types/pos.types'
import { POS_TABLE_STATE } from '../types/pos.types'

interface POSOrdersResult {
  readonly orders: Order[]
  readonly ordersByTable: Map<string, Order[]>
  readonly digitalOrders: Order[]
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

  const digitalOrders = useMemo(() => {
    return orders.filter(o => o.type !== 'table' && !o.tableId)
  }, [orders])

  const pendingCountRef = useRef(0)

  useEffect(() => {
    if (isLoading) return
    const currentPending = digitalOrders.filter(o => o.status === ORDER_STATUS.pending).length
    if (currentPending > pendingCountRef.current) {
      // Pitido de alerta cuando entra un nuevo pedido digital pendiente
      playNewOrderBeep()
    }
    pendingCountRef.current = currentPending
  }, [digitalOrders, isLoading])

  function tableState(tableId: string): POSTableState {
    const tableOrders = ordersByTable.get(tableId)
    if (!tableOrders || tableOrders.length === 0) return POS_TABLE_STATE.free
    if (tableOrders.some((o) => o.status === ORDER_STATUS.pending)) {
      return POS_TABLE_STATE.pending
    }
    return POS_TABLE_STATE.occupied
  }

  return { orders, ordersByTable, digitalOrders, tableState, isLoading }
}
