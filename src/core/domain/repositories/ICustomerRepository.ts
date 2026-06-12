import type { Customer } from '@core/domain/entities/Customer'

/** Datos mínimos del pedido para alimentar el perfil del cliente. */
export interface CustomerOrderSnapshot {
  readonly tenantId: string
  readonly phone: string
  readonly name: string
  readonly subtotal: number
  readonly currency: string
}

export interface ICustomerRepository {
  /** Crea o actualiza el perfil (id = teléfono normalizado) sumando el pedido. */
  upsertFromOrder(snapshot: CustomerOrderSnapshot): Promise<void>
  list(tenantId: string): Promise<Customer[]>
  updateNote(tenantId: string, customerId: string, note: string | null): Promise<void>
}
