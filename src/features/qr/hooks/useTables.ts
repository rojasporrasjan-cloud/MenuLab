import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { TableMapper } from '@infrastructure/mappers/TableMapper'
import type { Table } from '@core/domain/entities/Table'

export function useTables(tenantId: string | null) {
  const [data, setData] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) {
      setData([])
      setIsLoading(false)
      return
    }

    const q = query(
      collection(db, firestorePaths.tables(tenantId)),
      orderBy('number', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      setData(snap.docs.map((doc) => TableMapper.toDomain(doc, tenantId)))
      setIsLoading(false)
    }, (error) => {
      console.error('Error listening to tables:', error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [tenantId])

  return { data, isLoading }
}
