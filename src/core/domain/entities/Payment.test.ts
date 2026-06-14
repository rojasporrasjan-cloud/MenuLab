import { describe, it, expect } from 'vitest'
import { calculateCashChange } from './Payment'

describe('calculateCashChange', () => {
  it('devuelve el vuelto correcto', () => {
    expect(calculateCashChange(3800, 5000)).toBe(1200)
  })
  it('devuelve 0 cuando el efectivo no alcanza', () => {
    expect(calculateCashChange(5000, 3000)).toBe(0)
  })
  it('devuelve 0 cuando el pago es exacto', () => {
    expect(calculateCashChange(5000, 5000)).toBe(0)
  })
  it('nunca devuelve negativo', () => {
    expect(calculateCashChange(10000, 1)).toBe(0)
  })
})
