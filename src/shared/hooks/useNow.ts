import { useEffect, useState } from 'react'

const DEFAULT_TICK_MS = 1000

/**
 * Reloj en vivo: re-renderiza cada `intervalMs` con la hora actual.
 * Para relojes de pantalla (KDS/POS) y edades de tickets.
 */
export function useNow(intervalMs: number = DEFAULT_TICK_MS): Date {
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
