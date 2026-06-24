export const reservationQueryKeys = {
  all: (tenantId: string) => ['reservations', tenantId] as const,
  byDate: (tenantId: string, date: string) => ['reservations', tenantId, 'date', date] as const,
  stats: (tenantId: string, date: string) => ['reservations', tenantId, 'stats', date] as const,
} as const

/** Slots de reserva HH:MM cada N minutos entre dos horas. */
export function buildTimeSlots(startHour: number, endHour: number, stepMinutes: number): string[] {
  const slots: string[] = []
  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += stepMinutes) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mm = String(minutes % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}
