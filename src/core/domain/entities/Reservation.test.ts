import { describe, it, expect } from 'vitest'
import { calculateReservationStats, RESERVATION_STATUS, RESERVATION_SOURCE } from './Reservation'
import type { Reservation, ReservationStatus } from './Reservation'

let counter = 0
function res(status: ReservationStatus, partySize: number): Reservation {
  counter += 1
  return {
    id: `r-${counter}`, tenantId: 't1', customerName: 'X', customerPhone: '8888',
    partySize, date: '2026-06-20', time: '19:00', note: null, status,
    source: RESERVATION_SOURCE.qr, createdAt: new Date(),
  }
}

describe('calculateReservationStats', () => {
  it('cuenta por estado y suma comensales solo de reservas activas', () => {
    const stats = calculateReservationStats([
      res(RESERVATION_STATUS.pending, 2),
      res(RESERVATION_STATUS.confirmed, 4),
      res(RESERVATION_STATUS.seated, 3),
      res(RESERVATION_STATUS.cancelled, 5),
      res(RESERVATION_STATUS.no_show, 6),
    ])
    expect(stats.total).toBe(5)
    expect(stats.pending).toBe(1)
    expect(stats.confirmed).toBe(1)
    expect(stats.seated).toBe(1)
    expect(stats.cancelled).toBe(1)
    expect(stats.noShow).toBe(1)
    // totalGuests excluye cancelled y no_show: 2 + 4 + 3 = 9
    expect(stats.totalGuests).toBe(9)
  })

  it('cero en todo sin reservas', () => {
    const stats = calculateReservationStats([])
    expect(stats.total).toBe(0)
    expect(stats.totalGuests).toBe(0)
  })
})
