import { describe, it, expect } from 'vitest'
import { normalizeMovementQuantity, STOCK_MOVEMENT_TYPE } from './StockMovement'

describe('normalizeMovementQuantity', () => {
  it('compra suma stock (siempre positivo)', () => {
    expect(normalizeMovementQuantity(STOCK_MOVEMENT_TYPE.purchase, 10)).toBe(10)
    expect(normalizeMovementQuantity(STOCK_MOVEMENT_TYPE.purchase, -10)).toBe(10)
  })
  it('venta resta stock (siempre negativo)', () => {
    expect(normalizeMovementQuantity(STOCK_MOVEMENT_TYPE.sale, 10)).toBe(-10)
    expect(normalizeMovementQuantity(STOCK_MOVEMENT_TYPE.sale, -10)).toBe(-10)
  })
  it('merma resta stock (siempre negativo)', () => {
    expect(normalizeMovementQuantity(STOCK_MOVEMENT_TYPE.waste, 5)).toBe(-5)
  })
  it('ajuste conserva el signo indicado por el usuario', () => {
    expect(normalizeMovementQuantity(STOCK_MOVEMENT_TYPE.adjustment, 7)).toBe(7)
    expect(normalizeMovementQuantity(STOCK_MOVEMENT_TYPE.adjustment, -7)).toBe(-7)
  })
})
