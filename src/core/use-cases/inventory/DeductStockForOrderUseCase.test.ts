import { describe, it, expect } from 'vitest'
import { DeductStockForOrderUseCase } from './DeductStockForOrderUseCase'
import type { IRecipeRepository } from '@core/domain/repositories/IRecipeRepository'
import type { IStockMovementRepository } from '@core/domain/repositories/IStockMovementRepository'
import type { Order } from '@core/domain/entities/Order'
import type { Recipe } from '@core/domain/entities/Recipe'
import type { NewStockMovement } from '@core/domain/entities/StockMovement'

// safe (test): fixtures mínimos — el use-case solo lee order.id/tenantId/items y recipe.items.
function order(items: { dishId: string; quantity: number }[]): Order {
  return {
    id: 'o1', tenantId: 't1',
    items: items.map((i) => ({ dishId: i.dishId, dishName: i.dishId, quantity: i.quantity, unitPrice: 0, variantLabel: null, note: null })),
  } as unknown as Order
}
function recipe(dishId: string, items: { ingredientId: string; quantity: number }[]): Recipe {
  return {
    id: dishId, tenantId: 't1', dishId,
    items: items.map((i) => ({ ingredientId: i.ingredientId, ingredientName: i.ingredientId, quantity: i.quantity, unit: 'g' })),
  } as unknown as Recipe
}

describe('DeductStockForOrderUseCase', () => {
  it('agrega cantidades por ingrediente (plato×receta) y crea ventas negativas', async () => {
    const recipes: Record<string, Recipe> = {
      casado: recipe('casado', [{ ingredientId: 'arroz', quantity: 100 }, { ingredientId: 'frijol', quantity: 50 }]),
      fresco: recipe('fresco', [{ ingredientId: 'cas', quantity: 30 }]),
    }
    const movements: NewStockMovement[] = []
    const recipeRepo = { get: async (_t: string, dishId: string) => recipes[dishId] ?? null } as unknown as IRecipeRepository
    const stockRepo = {
      create: async (m: NewStockMovement) => { movements.push(m); return { ...m, id: 'x', createdAt: new Date() } },
    } as unknown as IStockMovementRepository

    await new DeductStockForOrderUseCase(recipeRepo, stockRepo).execute(
      order([{ dishId: 'casado', quantity: 2 }, { dishId: 'fresco', quantity: 3 }]),
    )

    const byIngredient = Object.fromEntries(movements.map((m) => [m.ingredientId, m.quantity]))
    expect(byIngredient['arroz']).toBe(-200) // 100 × 2
    expect(byIngredient['frijol']).toBe(-100) // 50 × 2
    expect(byIngredient['cas']).toBe(-90)     // 30 × 3
    expect(movements.every((m) => m.type === 'sale')).toBe(true)
    expect(movements.every((m) => m.orderId === 'o1')).toBe(true)
  })

  it('ignora platos sin receta (sin movimientos)', async () => {
    const movements: NewStockMovement[] = []
    const recipeRepo = { get: async () => null } as unknown as IRecipeRepository
    const stockRepo = {
      create: async (m: NewStockMovement) => { movements.push(m); return { ...m, id: 'x', createdAt: new Date() } },
    } as unknown as IStockMovementRepository

    await new DeductStockForOrderUseCase(recipeRepo, stockRepo).execute(order([{ dishId: 'sin-receta', quantity: 1 }]))
    expect(movements).toHaveLength(0)
  })
})
