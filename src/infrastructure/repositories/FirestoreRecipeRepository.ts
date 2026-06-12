import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { RecipeMapper } from '@infrastructure/mappers/RecipeMapper'
import type { IRecipeRepository } from '@core/domain/repositories/IRecipeRepository'
import type { NewRecipe, Recipe } from '@core/domain/entities/Recipe'

/**
 * Colección: tenants/{tenantId}/recipes — id del doc = dishId (1:1 con el plato).
 * El aislamiento multi-tenant está garantizado por el path de la subcolección.
 */
export class FirestoreRecipeRepository implements IRecipeRepository {
  async get(tenantId: string, dishId: string): Promise<Recipe | null> {
    const snap = await getDoc(doc(db, firestorePaths.recipe(tenantId, dishId)))
    if (!snap.exists()) return null
    return RecipeMapper.toDomain(snap, tenantId)
  }

  async list(tenantId: string): Promise<Recipe[]> {
    const snap = await getDocs(collection(db, firestorePaths.recipes(tenantId)))
    return snap.docs.map((d) => RecipeMapper.toDomain(d, tenantId))
  }

  async upsert(recipe: NewRecipe): Promise<void> {
    await setDoc(doc(db, firestorePaths.recipe(recipe.tenantId, recipe.dishId)), {
      tenantId: recipe.tenantId,
      dishId: recipe.dishId,
      items: recipe.items.map((i) => ({ ...i })),
      yield: recipe.yield,
      foodCostAmount: recipe.foodCostAmount,
      foodCostPercent: recipe.foodCostPercent,
      updatedAt: serverTimestamp(),
    })
  }
}
