import { useEffect, useRef, useState } from 'react'

import type { Order, OrderStatus } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'
import { OrderRealtimeService } from '@infrastructure/services/OrderRealtimeService'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'
import { playNewOrderBeep } from '@shared/utils/beep'

/** Estados visibles en el tablero de cocina. */
const KITCHEN_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.confirmed,
  ORDER_STATUS.preparing,
  ORDER_STATUS.ready,
]

export interface KitchenBoard {
  readonly incoming: Order[]
  readonly preparing: Order[]
  readonly ready: Order[]
}

interface KitchenOrdersState {
  readonly board: KitchenBoard
  readonly isLoading: boolean
  readonly error: Error | null
}

const EMPTY_BOARD: KitchenBoard = { incoming: [], preparing: [], ready: [] }

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function groupBoard(orders: Order[]): KitchenBoard {
  const today = orders.filter((o) => isToday(o.createdAt))
  return {
    incoming: today.filter((o) => o.status === ORDER_STATUS.confirmed),
    preparing: today.filter((o) => o.status === ORDER_STATUS.preparing),
    ready: today.filter((o) => o.status === ORDER_STATUS.ready),
  }
}

/**
 * Tablero de cocina en tiempo real (onSnapshot).
 * Suena un beep (Web Audio API) cuando entra un pedido nuevo a la columna NUEVOS.
 * Multi-tenant: la suscripción siempre va bajo tenants/{tenantId}/orders.
 */
export function useKitchenOrders(tenantId: string): KitchenOrdersState {
  const [state, setState] = useState<KitchenOrdersState>({
    board: EMPTY_BOARD,
    isLoading: true,
    error: null,
  })
  const knownIncomingIds = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!tenantId || !isFirebaseConfigured) {
      setState({ board: EMPTY_BOARD, isLoading: false, error: null })
      return
    }

    knownIncomingIds.current = null

    const unsubscribe = OrderRealtimeService.subscribeOrdersByStatuses(
      tenantId,
      KITCHEN_STATUSES,
      (orders) => {
        const board = groupBoard(orders)
        const incomingIds = new Set(board.incoming.map((o) => o.id))

        // Beep solo cuando aparece un ticket que no conocíamos (no en la carga inicial).
        if (knownIncomingIds.current !== null) {
          const previous = knownIncomingIds.current
          const hasNew = board.incoming.some((o) => !previous.has(o.id))
          if (hasNew) playNewOrderBeep()
        }
        knownIncomingIds.current = incomingIds

        setState({ board, isLoading: false, error: null })
      },
      (error) => setState({ board: EMPTY_BOARD, isLoading: false, error }),
    )

    return () => unsubscribe()
  }, [tenantId])

  return state
}
