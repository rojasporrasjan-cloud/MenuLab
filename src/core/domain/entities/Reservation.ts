export const RESERVATION_STATUS = {
  pending: 'pending',
  confirmed: 'confirmed',
  seated: 'seated',
  cancelled: 'cancelled',
  no_show: 'no_show',
} as const

export type ReservationStatus = (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS]

export const RESERVATION_SOURCE = {
  qr: 'qr',
  admin: 'admin',
  phone: 'phone',
} as const

export type ReservationSource = (typeof RESERVATION_SOURCE)[keyof typeof RESERVATION_SOURCE]

export interface Reservation {
  readonly id: string
  readonly tenantId: string
  readonly customerName: string
  readonly customerPhone: string
  readonly partySize: number
  /** Fecha en formato YYYY-MM-DD (zona horaria del restaurante). */
  readonly date: string
  /** Hora en formato HH:MM (slots de 30 minutos). */
  readonly time: string
  readonly note: string | null
  readonly status: ReservationStatus
  readonly source: ReservationSource
  readonly createdAt: Date
}

export type NewReservation = Omit<Reservation, 'id' | 'createdAt'>

export interface ReservationStats {
  readonly total: number
  readonly pending: number
  readonly confirmed: number
  readonly seated: number
  readonly cancelled: number
  readonly noShow: number
  readonly totalGuests: number
}

export function calculateReservationStats(reservations: readonly Reservation[]): ReservationStats {
  const active = reservations.filter(
    (r) => r.status !== RESERVATION_STATUS.cancelled && r.status !== RESERVATION_STATUS.no_show,
  )
  return {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === RESERVATION_STATUS.pending).length,
    confirmed: reservations.filter((r) => r.status === RESERVATION_STATUS.confirmed).length,
    seated: reservations.filter((r) => r.status === RESERVATION_STATUS.seated).length,
    cancelled: reservations.filter((r) => r.status === RESERVATION_STATUS.cancelled).length,
    noShow: reservations.filter((r) => r.status === RESERVATION_STATUS.no_show).length,
    totalGuests: active.reduce((sum, r) => sum + r.partySize, 0),
  }
}
