import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'

export const OnboardingService = {
  /**
   * Mark onboarding as completed for the given tenant.
   * Idempotent — safe to call multiple times.
   */
  async completeOnboarding(tenantId: string): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      onboardingCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  /**
   * Bulk-saves a list of categories and dishes extracted from a physical menu photo.
   * Clears out any existing default categories/dishes first.
   */
  async saveDigitizedMenu(
    tenantId: string,
    menuId: string,
    data: Array<{
      name: string
      dishes: Array<{
        name: string
        price: number
        description: string
      }>
    }>
  ): Promise<void> {
    const batch = writeBatch(db)

    // 1. Fetch and delete existing categories for this menu
    const categoriesRef = collection(db, firestorePaths.categories(tenantId, menuId))
    const existingCatsSnap = await getDocs(categoriesRef)
    existingCatsSnap.docs.forEach((d) => {
      batch.delete(doc(db, firestorePaths.category(tenantId, menuId, d.id)))
    })

    // 2. Fetch and delete existing dishes for this menu
    const dishesRef = collection(db, firestorePaths.dishes(tenantId, menuId))
    const existingDishesSnap = await getDocs(dishesRef)
    existingDishesSnap.docs.forEach((d) => {
      batch.delete(doc(db, firestorePaths.dish(tenantId, menuId, d.id)))
    })

    const newCategoryIds: string[] = []

    // 3. Write new categories and their dishes
    data.forEach((catData, catIndex) => {
      const catId = doc(collection(db, firestorePaths.categories(tenantId, menuId))).id
      newCategoryIds.push(catId)

      batch.set(doc(db, firestorePaths.category(tenantId, menuId, catId)), {
        id: catId,
        tenantId,
        menuId,
        name: catData.name.trim(),
        description: '',
        sortOrder: catIndex,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      catData.dishes.forEach((dishData, dishIndex) => {
        const dishId = doc(collection(db, firestorePaths.dishes(tenantId, menuId))).id
        batch.set(doc(db, firestorePaths.dish(tenantId, menuId, dishId)), {
          id: dishId,
          tenantId,
          menuId,
          categoryId: catId,
          name: dishData.name.trim(),
          description: dishData.description.trim(),
          price: {
            amount: dishData.price,
            currency: 'CRC',
          },
          status: 'available',
          sortOrder: dishIndex,
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
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
          },
          tags: [],
          variantGroups: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      })
    })

    // 4. Update the parent menu with the new category ordering
    batch.update(doc(db, firestorePaths.menu(tenantId, menuId)), {
      categoryOrder: newCategoryIds,
      updatedAt: serverTimestamp(),
    })

    await batch.commit()
  },
}
