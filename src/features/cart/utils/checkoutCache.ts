import type { OrderType } from '@core/domain/entities/Order'

/**
 * Persistencia local de los datos del cliente para el checkout, para que no
 * tenga que volver a escribir nombre/teléfono/dirección en cada pedido.
 * Se guarda por tenant en localStorage (no es PII sensible del negocio).
 */
export interface CheckoutCache {
  readonly customerName: string
  readonly customerPhone: string
  readonly address: string
  readonly mode: OrderType
}

function storageKey(tenantId: string): string {
  return `slr.checkout.${tenantId}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isOrderType(value: unknown): value is OrderType {
  return value === 'table' || value === 'pickup' || value === 'delivery'
}

export function loadCheckoutCache(tenantId: string): Partial<CheckoutCache> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(storageKey(tenantId))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return {}
    return {
      customerName: typeof parsed['customerName'] === 'string' ? parsed['customerName'] : undefined,
      customerPhone: typeof parsed['customerPhone'] === 'string' ? parsed['customerPhone'] : undefined,
      address: typeof parsed['address'] === 'string' ? parsed['address'] : undefined,
      mode: isOrderType(parsed['mode']) ? parsed['mode'] : undefined,
    }
  } catch {
    return {}
  }
}

export function saveCheckoutCache(tenantId: string, data: CheckoutCache): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(storageKey(tenantId), JSON.stringify(data))
  } catch {
    // Cuota llena o almacenamiento no disponible: el pedido continúa igual.
  }
}
