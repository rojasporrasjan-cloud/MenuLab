import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { ReservationMapper } from '@infrastructure/mappers/ReservationMapper'
import type { Reservation } from '@core/domain/entities/Reservation'

/** Reservas de un día concreto (YYYY-MM-DD) para el panel del admin. */
export function useReservationsByDate(tenantId: string, date: string) {
  const [data, setData] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !date) {
      setData([])
      setIsLoading(false)
      return
    }

    const q = query(
      collection(db, firestorePaths.reservations(tenantId)),
      where('date', '==', date)
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      const mapped = snap.docs.map((doc) => ReservationMapper.toDomain(doc, tenantId))
      // Sort in memory to avoid requiring a composite index in Firestore
      mapped.sort((a, b) => a.time.localeCompare(b.time))
      console.log('Realtime reservations update:', mapped)
      setData(mapped)
      setIsLoading(false)
    }, (error) => {
      console.error('Error listening to reservations:', error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [tenantId, date])

  return { data, isLoading }
}
