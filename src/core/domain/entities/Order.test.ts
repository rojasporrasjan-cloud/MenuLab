import { describe, it, expect } from 'vitest'
import { nextOrderStatus, calculateOrderSubtotal, ORDER_STATUS } from './Order'
import type { OrderItem } from './Order'

function item(unitPrice: number, quantity: number): OrderItem {
  return { dishId: 'd', dishName: 'x', quantity, unitPrice, variantLabel: null, note: null }
}

describe('calculateOrderSubtotal', () => {
  it('suma precio × cantidad de cada item', () => {
    expect(calculateOrderSubtotal([item(1000, 2), item(500, 3)])).toBe(3500)
  })
  it('devuelve 0 sin items', () => {
    expect(calculateOrderSubtotal([])).toBe(0)
  })
})

describe('nextOrderStatus', () => {
  it('avanza por el flujo natural del pedido', () => {
    expect(nextOrderStatus(ORDER_STATUS.pending)).toBe(ORDER_STATUS.confirmed)
    expect(nextOrderStatus(ORDER_STATUS.confirmed)).toBe(ORDER_STATUS.preparing)
    expect(nextOrderStatus(ORDER_STATUS.preparing)).toBe(ORDER_STATUS.ready)
    expect(nextOrderStatus(ORDER_STATUS.ready)).toBe(ORDER_STATUS.delivered)
  })
  it('devuelve null en el estado final (delivered)', () => {
    expect(nextOrderStatus(ORDER_STATUS.delivered)).toBeNull()
  })
  it('devuelve null para un estado fuera del flujo (cancelled)', () => {
    expect(nextOrderStatus(ORDER_STATUS.cancelled)).toBeNull()
  })
})
