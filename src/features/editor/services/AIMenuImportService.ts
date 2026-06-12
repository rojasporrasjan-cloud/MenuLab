import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import type { GeminiMenuPayload } from './AIParserService'

// Saves Gemini-extracted categories and dishes into Firestore, using the
// Gemini-generated IDs (cat-1, dish-1, …) as Firestore document IDs.
// This lets the DataLayers produced by parseGeminiPayload reference real docs.
// Replaces any existing categories/dishes in the menu (full import).
export async function importGeminiMenuToFirestore(
  tenantId: string,
  menuId: string,
  payload: GeminiMenuPayload,
): Promise<void> {
  const batch = writeBatch(db)

  // Delete existing categories for this menu
  const existingCats = await getDocs(
    collection(db, firestorePaths.categories(tenantId, menuId)),
  )
  existingCats.docs.forEach((d) => batch.delete(d.ref))

  // Delete existing dishes for this menu
  const existingDishes = await getDocs(
    collection(db, firestorePaths.dishes(tenantId, menuId)),
  )
  existingDishes.docs.forEach((d) => batch.delete(d.ref))

  // Write new categories using Gemini IDs as document IDs
  payload.categories.forEach((cat, index) => {
    batch.set(doc(db, firestorePaths.category(tenantId, menuId, cat.id)), {
      id: cat.id,
      tenantId,
      menuId,
      name: cat.name,
      description: '',
      sortOrder: index,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  // Write new dishes using Gemini IDs as document IDs
  payload.dishes.forEach((dish, index) => {
    const numericAmount = dish.numericPrice ?? 0
    batch.set(doc(db, firestorePaths.dish(tenantId, menuId, dish.id)), {
      id: dish.id,
      tenantId,
      menuId,
      categoryId: dish.categoryId,
      name: dish.name,
      description: dish.description ?? '',
      price: {
        amount: numericAmount,
        currency: payload.detectedLocale === 'es-CR' ? 'CRC' : 'USD',
      },
      status: 'available',
      sortOrder: index,
      tags: dish.tags,
      assets: {
        imageUrl: null,
        thumbnailUrl: null,
        modelGlbUrl: null,
        modelUsdzUrl: null,
        hasAR: false,
      },
      nutrition: {
        calories: null,
        allergens: [],
        isVegetarian: dish.tags.includes('vegetarian') || dish.tags.includes('vegan'),
        isVegan: dish.tags.includes('vegan'),
        isGlutenFree: dish.tags.includes('gluten-free'),
      },
      variantGroups: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  // Update menu's categoryOrder
  batch.update(doc(db, firestorePaths.menu(tenantId, menuId)), {
    categoryOrder: payload.categories.map((c) => c.id),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}
