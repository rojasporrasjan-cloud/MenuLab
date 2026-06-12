import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { OrderMapper } from '@infrastructure/mappers/OrderMapper'
import type { Order, OrderStatus } from '@core/domain/entities/Order'
import { ACTIVE_ORDER_STATUSES } from '@core/domain/entities/Order'

/**
 * Suscripciones en tiempo real a pedidos (admin + KDS).
 * Índice compuesto requerido: orders — status (ASC) + createdAt (DESC).
 * Multi-tenant: el path de la subcolección incluye siempre el tenantId.
 */
export const OrderRealtimeService = {
  /** Pedidos activos del tenant (pending/confirmed/preparing/ready). */
  subscribeActiveOrders(
    tenantId: string,
    onOrders: (orders: Order[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, firestorePaths.orders(tenantId)),
      where('status', 'in', [...ACTIVE_ORDER_STATUSES]),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(
      q,
      (snap) => onOrders(snap.docs.map((d) => OrderMapper.toDomain(d, tenantId))),
      (error) => onError?.(error),
    )
  },

  /** Pedidos en estados específicos (ej: cocina → confirmed/preparing/ready). */
  subscribeOrdersByStatuses(
    tenantId: string,
    statuses: readonly OrderStatus[],
    onOrders: (orders: Order[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, firestorePaths.orders(tenantId)),
      where('status', 'in', [...statuses]),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(
      q,
      (snap) => onOrders(snap.docs.map((d) => OrderMapper.toDomain(d, tenantId))),
      (error) => onError?.(error),
    )
  },
} as const
