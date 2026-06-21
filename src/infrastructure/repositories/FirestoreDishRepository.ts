import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { DishMapper } from '@infrastructure/mappers/DishMapper'
import type { IDishRepository } from '@core/domain/repositories/IDishRepository'
import type { Dish } from '@core/domain/entities/Dish'
import { NotFoundError } from '@core/errors/NotFoundError'

export class FirestoreDishRepository implements IDishRepository {
  async getByMenuId(tenantId: string, menuId: string): Promise<Dish[]> {
    const q = query(
      collection(db, firestorePaths.dishes(tenantId, menuId)),
      orderBy('sortOrder', 'asc'),
    )
    const snap = await getDocs(q)
    return snap.docs
      .map((d) => DishMapper.toDomain(d, tenantId, menuId))
      .filter((dish) => dish.status === 'available')
  }

  async getById(tenantId: string, menuId: string, dishId: string): Promise<Dish> {
    const snap = await getDoc(
      doc(db, firestorePaths.dishes(tenantId, menuId), dishId),
    )
    if (!snap.exists()) throw new NotFoundError('Dish', dishId)
    return DishMapper.toDomain(snap, tenantId, menuId)
  }

  async getByCategoryId(
    tenantId: string,
    menuId: string,
    categoryId: string,
  ): Promise<Dish[]> {
    const q = query(
      collection(db, firestorePaths.dishes(tenantId, menuId)),
      where('categoryId', '==', categoryId),
    )
    const snap = await getDocs(q)
    return snap.docs
      .map((d) => DishMapper.toDomain(d, tenantId, menuId))
      .filter((dish) => dish.status === 'available')
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }
}
