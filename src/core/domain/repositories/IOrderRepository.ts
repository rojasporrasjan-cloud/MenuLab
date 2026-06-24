import type { NewOrder, Order, OrderStatus, PaymentStatus } from '../entities/Order'

export interface IOrderRepository {
  create(order: NewOrder): Promise<Order>
  /** Pedidos con estado activo (pending/confirmed/preparing/ready). */
  listActive(tenantId: string): Promise<Order[]>
  /** Pedidos de un día concreto. `date` en formato YYYY-MM-DD. */
  listByDate(tenantId: string, date: string): Promise<Order[]>
  /** Últimos N pedidos del tenant (para CRM e historial). */
  listRecent(tenantId: string, max: number): Promise<Order[]>
  /** Pedidos en un rango de fechas [start, end] (para analíticas). */
  listBetween(tenantId: string, start: Date, end: Date): Promise<Order[]>
  updateStatus(tenantId: string, orderId: string, status: OrderStatus): Promise<void>
  updatePaymentStatus(tenantId: string, orderId: string, paymentStatus: PaymentStatus): Promise<void>
}
