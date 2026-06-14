import { useEffect, useState } from 'react'
import type { Order } from '@core/domain/entities/Order'
import { OrderRealtimeService } from '@infrastructure/services/OrderRealtimeService'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'

interface ActiveOrdersState {
  readonly orders: Order[]
  readonly isLoading: boolean
  readonly error: Error | null
}

/**
 * Pedidos activos del tenant en tiempo real (onSnapshot).
 * Para el panel de pedidos del admin y los badges del sidebar.
 */
export function useActiveOrders(tenantId: string): ActiveOrdersState {
  const [state, setState] = useState<ActiveOrdersState>({
    orders: [],
    isLoading: true,
    error: null,
  })
  const enabled = Boolean(tenantId) && isFirebaseConfigured

  useEffect(() => {
    if (!enabled) return
    const unsubscribe = OrderRealtimeService.subscribeActiveOrders(
      tenantId,
      (orders) => setState({ orders, isLoading: false, error: null }),
      (error) => setState({ orders: [], isLoading: false, error }),
    )
    return () => unsubscribe()
  }, [tenantId, enabled])

  // Sin tenant o sin Firebase: estado vacío derivado (sin setState en el efecto).
  if (!enabled) return { orders: [], isLoading: false, error: null }
  return state
}
