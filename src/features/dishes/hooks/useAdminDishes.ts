import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { DishMapper } from '@infrastructure/mappers/DishMapper'
import { DishService } from '../services/DishService'
import { dishQueryKeys } from '../types/dish.types'

export function useAdminDishes(tenantId: string | null, menuId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = dishQueryKeys.byMenu(tenantId ?? '', menuId ?? '')

  const queryResult = useQuery({
    queryKey,
    queryFn: () => DishService.getDishesByMenu(tenantId ?? '', menuId ?? ''),
    enabled: !!tenantId && !!menuId,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!tenantId || !menuId) return

    const q = query(
      collection(db, firestorePaths.dishes(tenantId, menuId)),
      orderBy('sortOrder', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      const dishes = snap.docs.map(doc => DishMapper.toDomain(doc, tenantId, menuId))
      queryClient.setQueryData(queryKey, dishes)
    })

    return () => unsubscribe()
  }, [tenantId, menuId, queryClient, queryKey.join('-')])

  return queryResult
}
