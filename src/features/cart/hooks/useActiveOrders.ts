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

  useEffect(() => {
    if (!tenantId || !isFirebaseConfigured) {
      setState({ orders: [], isLoading: false, error: null })
      return
    }
    const unsubscribe = OrderRealtimeService.subscribeActiveOrders(
      tenantId,
      (orders) => setState({ orders, isLoading: false, error: null }),
      (error) => setState({ orders: [], isLoading: false, error }),
    )
    return () => unsubscribe()
  }, [tenantId])

  return state
}
