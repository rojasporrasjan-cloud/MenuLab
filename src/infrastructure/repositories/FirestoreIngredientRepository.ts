import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { IngredientMapper } from '@infrastructure/mappers/IngredientMapper'
import type { IIngredientRepository } from '@core/domain/repositories/IIngredientRepository'
import type {
  Ingredient,
  IngredientUpdate,
  NewIngredient,
} from '@core/domain/entities/Ingredient'
import { NotFoundError } from '@core/errors/NotFoundError'

/**
 * Colección: tenants/{tenantId}/ingredients
 * El aislamiento multi-tenant está garantizado por el path de la subcolección.
 */
export class FirestoreIngredientRepository implements IIngredientRepository {
  async list(tenantId: string): Promise<Ingredient[]> {
    const q = query(
      collection(db, firestorePaths.ingredients(tenantId)),
      orderBy('name', 'asc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => IngredientMapper.toDomain(d, tenantId))
  }

  async create(ingredient: NewIngredient): Promise<Ingredient> {
    const ref = await addDoc(collection(db, firestorePaths.ingredients(ingredient.tenantId)), {
      ...ingredient,
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new NotFoundError('Ingredient', ref.id)
    return IngredientMapper.toDomain(snap, ingredient.tenantId)
  }

  async update(tenantId: string, ingredientId: string, changes: IngredientUpdate): Promise<void> {
    await updateDoc(doc(db, firestorePaths.ingredient(tenantId, ingredientId)), {
      ...changes,
      updatedAt: serverTimestamp(),
    })
  }
}
