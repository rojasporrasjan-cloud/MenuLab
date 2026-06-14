import { describe, it, expect } from 'vitest'
import { isLowStock, selectLowStockIngredients } from './Ingredient'
import type { Ingredient } from './Ingredient'

function ing(id: string, currentStock: number, minimumStock: number): Ingredient {
  return {
    id, tenantId: 't1', name: id, unit: 'unit', currentStock, minimumStock,
    costPerUnit: 1, currency: 'CRC', category: null, updatedAt: new Date(),
  }
}

describe('isLowStock', () => {
  it('true cuando el stock está bajo el mínimo', () => {
    expect(isLowStock(ing('a', 5, 10))).toBe(true)
  })
  it('false cuando el stock iguala o supera el mínimo', () => {
    expect(isLowStock(ing('a', 10, 10))).toBe(false)
    expect(isLowStock(ing('a', 20, 10))).toBe(false)
  })
})

describe('selectLowStockIngredients', () => {
  it('devuelve solo los que están bajo mínimo, más crítico primero', () => {
    const result = selectLowStockIngredients([ing('a', 5, 10), ing('b', 20, 10), ing('c', 1, 10)])
    expect(result.map((i) => i.id)).toEqual(['c', 'a'])
  })
  it('lista vacía si ninguno está bajo mínimo', () => {
    expect(selectLowStockIngredients([ing('a', 20, 10)])).toEqual([])
  })
})
