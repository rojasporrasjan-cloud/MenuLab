import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { DishMapper } from '@infrastructure/mappers/DishMapper'
import { MenuMapper } from '@infrastructure/mappers/MenuMapper'
import { CategoryMapper } from '@infrastructure/mappers/CategoryMapper'
import type { Dish } from '@core/domain/entities/Dish'
import type { Menu } from '@core/domain/entities/Menu'
import type { Category } from '@core/domain/entities/Category'
import type { DishFormValues } from '../types/dish.types'
import { tagsFromString } from '../types/dish.types'

export const DishService = {
  // ── Menus ──────────────────────────────────────────────────────────────────

  async getMenus(tenantId: string): Promise<Menu[]> {
    const snap = await getDocs(
      query(collection(db, firestorePaths.menus(tenantId)), orderBy('createdAt', 'asc')),
    )
    return snap.docs.map((d) => MenuMapper.toDomain(d, tenantId))
  },

  // ── Categories ─────────────────────────────────────────────────────────────

  async getCategories(tenantId: string, menuId: string): Promise<Category[]> {
    const snap = await getDocs(
      query(
        collection(db, firestorePaths.categories(tenantId, menuId)),
        orderBy('sortOrder', 'asc'),
      ),
    )
    return snap.docs.map((d) => CategoryMapper.toDomain(d, tenantId, menuId))
  },

  // ── Dishes ─────────────────────────────────────────────────────────────────

  async getDishesByMenu(tenantId: string, menuId: string): Promise<Dish[]> {
    const snap = await getDocs(
      query(
        collection(db, firestorePaths.dishes(tenantId, menuId)),
        orderBy('sortOrder', 'asc'),
      ),
    )
    return snap.docs.map((d) => DishMapper.toDomain(d, tenantId, menuId))
  },

  async getDishById(tenantId: string, menuId: string, dishId: string): Promise<Dish | null> {
    const snap = await getDoc(doc(db, firestorePaths.dish(tenantId, menuId, dishId)))
    if (!snap.exists()) return null
    return DishMapper.toDomain(snap, tenantId, menuId)
  },

  async createDish(
    tenantId: string,
    menuId: string,
    values: DishFormValues,
    imageUrl: string | null,
  ): Promise<Dish> {
    const docData = buildFirestorePayload(tenantId, menuId, values, imageUrl)
    const ref = await addDoc(collection(db, firestorePaths.dishes(tenantId, menuId)), {
      ...docData,
      sortOrder: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: ref.id,
      ...docData,
      sortOrder: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Dish
  },

  async updateDish(
    tenantId: string,
    menuId: string,
    dishId: string,
    values: DishFormValues,
    imageUrl: string | null,
  ): Promise<void> {
    const docData = buildFirestorePayload(tenantId, menuId, values, imageUrl)
    await updateDoc(doc(db, firestorePaths.dish(tenantId, menuId, dishId)), {
      ...docData,
      updatedAt: serverTimestamp(),
    })
  },

  async deleteDish(tenantId: string, menuId: string, dishId: string): Promise<void> {
    await deleteDoc(doc(db, firestorePaths.dish(tenantId, menuId, dishId)))
  },

  async toggleDishStatus(
    tenantId: string,
    menuId: string,
    dishId: string,
    newStatus: Dish['status'],
  ): Promise<void> {
    await updateDoc(doc(db, firestorePaths.dish(tenantId, menuId, dishId)), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    })
  },

  /** Actualiza solo el monto del precio (uso operativo: panel staff). */
  async updateDishPrice(
    tenantId: string,
    menuId: string,
    dishId: string,
    amount: number,
  ): Promise<void> {
    await updateDoc(doc(db, firestorePaths.dish(tenantId, menuId, dishId)), {
      'price.amount': amount,
      updatedAt: serverTimestamp(),
    })
  },

  async swapDishOrder(
    tenantId: string,
    menuId: string,
    dishA: Dish,
    dishB: Dish,
  ): Promise<void> {
    const batch = writeBatch(db)
    batch.update(doc(db, firestorePaths.dish(tenantId, menuId, dishA.id)), {
      sortOrder: dishB.sortOrder,
      updatedAt: serverTimestamp(),
    })
    batch.update(doc(db, firestorePaths.dish(tenantId, menuId, dishB.id)), {
      sortOrder: dishA.sortOrder,
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
  },
}

// ── Private helpers ───────────────────────────────────────────────────────────

function buildFirestorePayload(
  tenantId: string,
  menuId: string,
  values: DishFormValues,
  imageUrl: string | null,
) {
  const tags = tagsFromString(values.tags)
  const allergens = tagsFromString(values.allergens)
  const caloriesNum = values.calories ? parseFloat(values.calories) : null

  return {
    tenantId,
    menuId,
    categoryId: values.categoryId || null,
    name: values.name,
    description: values.description || null,
    price: {
      amount: parseFloat(values.priceAmount),
      currency: values.priceCurrency,
    },
    status: values.status,
    assets: {
      imageUrl,
      thumbnailUrl: null,
      modelGlbUrl: null,
      modelUsdzUrl: null,
      hasAR: false,
    },
    nutrition: {
      calories: caloriesNum,
      allergens,
      isVegetarian: values.isVegetarian,
      isVegan: values.isVegan,
      isGlutenFree: values.isGlutenFree,
    },
    tags,
    variantGroups: values.variantGroups ?? [],
    featured: values.featured,
    // El rank define el orden del carrusel: al (re)destacar, va al final.
    featuredRank: values.featured ? Date.now() : null,
  }
}
