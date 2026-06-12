import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { StockMovementMapper } from '@infrastructure/mappers/StockMovementMapper'
import type { IStockMovementRepository } from '@core/domain/repositories/IStockMovementRepository'
import type { NewStockMovement, StockMovement } from '@core/domain/entities/StockMovement'

/**
 * Colección: tenants/{tenantId}/stock_movements
 * `create` usa writeBatch: el movimiento y el ajuste de stock del ingrediente
 * se aplican de forma atómica (o ambos o ninguno).
 *
 * Índice compuesto requerido (firestore.indexes.json):
 *   collection: stock_movements — fields: ingredientId (ASC), createdAt (DESC)
 */
export class FirestoreStockMovementRepository implements IStockMovementRepository {
  async create(movement: NewStockMovement): Promise<void> {
    const batch = writeBatch(db)
    const movementRef = doc(collection(db, firestorePaths.stockMovements(movement.tenantId)))
    const ingredientRef = doc(
      db,
      firestorePaths.ingredient(movement.tenantId, movement.ingredientId),
    )

    batch.set(movementRef, { ...movement, createdAt: serverTimestamp() })
    batch.update(ingredientRef, {
      currentStock: increment(movement.quantity),
      updatedAt: serverTimestamp(),
    })

    await batch.commit()
  }

  async list(
    tenantId: string,
    ingredientId: string | null,
    max: number,
  ): Promise<StockMovement[]> {
    const base = collection(db, firestorePaths.stockMovements(tenantId))
    const q = ingredientId
      ? query(base, where('ingredientId', '==', ingredientId), orderBy('createdAt', 'desc'), limit(max))
      : query(base, orderBy('createdAt', 'desc'), limit(max))
    const snap = await getDocs(q)
    return snap.docs.map((d) => StockMovementMapper.toDomain(d, tenantId))
  }
}
