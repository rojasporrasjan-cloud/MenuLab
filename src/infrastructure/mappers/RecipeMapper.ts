import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { Recipe, RecipeItem } from '@core/domain/entities/Recipe'
import type { IngredientUnit } from '@core/domain/entities/Ingredient'
import { INGREDIENT_UNIT } from '@core/domain/entities/Ingredient'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDateOrEpoch(value: unknown): Date {
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

function toItems(raw: unknown): RecipeItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item: unknown) => {
    const record: Record<string, unknown> =
      item && typeof item === 'object' ? (item as Record<string, unknown>) : {} // safe: validado objeto en la condición
    return {
      ingredientId: String(record['ingredientId'] ?? ''),
      ingredientName: String(record['ingredientName'] ?? ''),
      quantity: Number(record['quantity'] ?? 0),
      unit: toUnit(record['unit']),
    }
  })
}

export class RecipeMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): Recipe {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      dishId: String(data['dishId'] ?? doc.id),
      items: toItems(data['items']),
      yield: Number(data['yield'] ?? 1),
      foodCostAmount: Number(data['foodCostAmount'] ?? 0),
      foodCostPercent: Number(data['foodCostPercent'] ?? 0),
      updatedAt: toDateOrEpoch(data['updatedAt']),
    }
  }
}
