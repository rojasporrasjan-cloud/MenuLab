import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import type {
  Dish,
  DishAssets,
  DishNutrition,
  DishPrice,
  DishStatus,
  DishVariantGroup,
} from '@core/domain/entities/Dish'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

export class DishMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string, menuId: string): Dish {
    const data = doc.data()!

    return {
      id: doc.id,
      tenantId,
      menuId,
      categoryId: data['categoryId'] as string,
      name: data['name'] as string,
      description: (data['description'] as string | null) ?? null,
      price: data['price'] as DishPrice,
      status: data['status'] as DishStatus,
      assets: data['assets'] as DishAssets,
      nutrition: data['nutrition'] as DishNutrition,
      tags: (data['tags'] as string[]) ?? [],
      variantGroups: (data['variantGroups'] as DishVariantGroup[]) ?? [],
      sortOrder: (data['sortOrder'] as number) ?? 0,
      featured: Boolean(data['featured'] ?? false),
      featuredRank: typeof data['featuredRank'] === 'number' ? data['featuredRank'] : null,
      createdAt: data['createdAt'].toDate() as Date,
      updatedAt: data['updatedAt'].toDate() as Date,
    }
  }
}
