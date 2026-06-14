import { describe, it, expect } from 'vitest'
import { calculateFoodCostAmount, calculateFoodCostPercent } from './Recipe'
import type { RecipeItem } from './Recipe'
import type { Ingredient } from './Ingredient'

function ing(id: string, costPerUnit: number): Ingredient {
  return {
    id, tenantId: 't1', name: id, unit: 'g', currentStock: 100,
    minimumStock: 10, costPerUnit, currency: 'CRC', category: null, updatedAt: new Date(),
  }
}
function recItem(ingredientId: string, quantity: number): RecipeItem {
  return { ingredientId, ingredientName: ingredientId, quantity, unit: 'g' }
}

describe('calculateFoodCostAmount', () => {
  const ingredients = [ing('a', 10), ing('b', 5)]

  it('suma costo×cantidad y divide por las porciones', () => {
    // a: 10*20=200, b: 5*40=200 → 400 / 2 = 200 por porción
    expect(calculateFoodCostAmount([recItem('a', 20), recItem('b', 40)], ingredients, 2)).toBe(200)
  })
  it('trata yield 0 como 1 porción', () => {
    expect(calculateFoodCostAmount([recItem('a', 10)], ingredients, 0)).toBe(100)
  })
  it('ignora ingredientes inexistentes (costo 0)', () => {
    expect(calculateFoodCostAmount([recItem('zzz', 10)], ingredients, 1)).toBe(0)
  })
  it('devuelve 0 sin items', () => {
    expect(calculateFoodCostAmount([], ingredients, 1)).toBe(0)
  })
})

describe('calculateFoodCostPercent', () => {
  it('calcula el % contra el precio de venta', () => {
    expect(calculateFoodCostPercent(300, 1000)).toBe(30)
  })
  it('devuelve 0 si el precio es 0 o negativo', () => {
    expect(calculateFoodCostPercent(300, 0)).toBe(0)
    expect(calculateFoodCostPercent(300, -5)).toBe(0)
  })
})
