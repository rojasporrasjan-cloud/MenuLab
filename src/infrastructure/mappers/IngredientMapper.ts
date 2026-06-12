import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { Ingredient, IngredientUnit } from '@core/domain/entities/Ingredient'
import { INGREDIENT_UNIT } from '@core/domain/entities/Ingredient'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDateOrNow(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp con toDate()
  }
  return new Date(0)
}

function toUnit(raw: unknown): IngredientUnit {
  const units: readonly string[] = Object.values(INGREDIENT_UNIT)
  return typeof raw === 'string' && units.includes(raw)
    ? (raw as IngredientUnit) // safe: validado contra INGREDIENT_UNIT en la línea anterior
    : INGREDIENT_UNIT.unit
}

export class IngredientMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): Ingredient {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      name: String(data['name'] ?? ''),
      unit: toUnit(data['unit']),
      currentStock: Number(data['currentStock'] ?? 0),
      minimumStock: Number(data['minimumStock'] ?? 0),
      costPerUnit: Number(data['costPerUnit'] ?? 0),
      currency: String(data['currency'] ?? 'CRC'),
      category: typeof data['category'] === 'string' ? data['category'] : null,
      updatedAt: toDateOrNow(data['updatedAt']),
    }
  }
}
