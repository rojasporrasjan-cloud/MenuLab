export const STOCK_MOVEMENT_TYPE = {
  purchase: 'purchase',
  sale: 'sale',
  waste: 'waste',
  adjustment: 'adjustment',
} as const

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPE)[keyof typeof STOCK_MOVEMENT_TYPE]

export interface StockMovement {
  readonly id: string
  readonly tenantId: string
  readonly ingredientId: string
  readonly type: StockMovementType
  /** Cantidad con signo: positiva añade stock, negativa lo descuenta. */
  readonly quantity: number
  readonly note: string | null
  /** Pedido que originó la salida (descuento automático), si aplica. */
  readonly orderId: string | null
  readonly createdAt: Date
  readonly createdBy: string
}

export type NewStockMovement = Omit<StockMovement, 'id' | 'createdAt'>

/** Normaliza el signo según el tipo: compras suman; ventas y mermas restan. */
export function normalizeMovementQuantity(type: StockMovementType, quantity: number): number {
  const magnitude = Math.abs(quantity)
  if (type === STOCK_MOVEMENT_TYPE.purchase) return magnitude
  if (type === STOCK_MOVEMENT_TYPE.sale || type === STOCK_MOVEMENT_TYPE.waste) return -magnitude
  // adjustment conserva el signo que indique el usuario
  return quantity
}
