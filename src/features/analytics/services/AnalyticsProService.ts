import { collectionGroup, getDocs, query, where } from 'firebase/firestore'

import { db } from '@infrastructure/firebase/firestore'
import { FirestoreOrderRepository } from '@infrastructure/repositories/FirestoreOrderRepository'
import { FirestoreRecipeRepository } from '@infrastructure/repositories/FirestoreRecipeRepository'
import { ListOrdersBetweenUseCase } from '@core/use-cases/order/ListOrdersBetweenUseCase'
import { ListRecipesUseCase } from '@core/use-cases/inventory/ListRecipesUseCase'
import type { Order } from '@core/domain/entities/Order'

/** Datos mínimos de un plato para menu engineering. */
export interface DishIndexEntry {
  readonly dishId: string
  readonly name: string
  readonly price: number
}

const orderRepository = new FirestoreOrderRepository()
const recipeRepository = new FirestoreRecipeRepository()

const listOrdersBetween = new ListOrdersBetweenUseCase(orderRepository)
const listRecipes = new ListRecipesUseCase(recipeRepository)

/**
 * Datos de soporte para las secciones Analytics Pro (funnel, menu engineering,
 * horas pico). Composition root de los use-cases que consultan orders/recipes.
 */
export const AnalyticsProService = {
  /** Pedidos de los últimos `days` días. */
  async getOrdersRange(tenantId: string, days: number): Promise<Order[]> {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    return listOrdersBetween.execute(tenantId, start, end)
  },

  /** id → nombre/precio de todos los platos del tenant (collectionGroup, mismo patrón que getDishNameMap). */
  async getDishIndex(tenantId: string): Promise<Map<string, DishIndexEntry>> {
    const snap = await getDocs(
      query(collectionGroup(db, 'dishes'), where('tenantId', '==', tenantId)),
    )
    const index = new Map<string, DishIndexEntry>()
    for (const doc of snap.docs) {
      const data = doc.data()
      const priceRaw: unknown = data['price']
      const priceRecord: Record<string, unknown> =
        priceRaw && typeof priceRaw === 'object' ? (priceRaw as Record<string, unknown>) : {} // safe: validado objeto en la condición
      index.set(doc.id, {
        dishId: doc.id,
        name: String(data['name'] ?? doc.id),
        price: Number(priceRecord['amount'] ?? 0),
      })
    }
    return index
  },

  /** Food cost por dishId (de las recetas guardadas). */
  async getFoodCostIndex(tenantId: string): Promise<Map<string, number>> {
    const recipes = await listRecipes.execute(tenantId)
    return new Map(recipes.map((r) => [r.dishId, r.foodCostAmount]))
  },
} as const
