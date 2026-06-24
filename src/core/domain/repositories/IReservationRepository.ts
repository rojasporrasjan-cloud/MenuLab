import type {
  NewReservation,
  Reservation,
  ReservationStatus,
} from '@core/domain/entities/Reservation'

export interface IReservationRepository {
  create(reservation: NewReservation): Promise<Reservation>
  listByDate(tenantId: string, date: string): Promise<Reservation[]>
  updateStatus(tenantId: string, reservationId: string, status: ReservationStatus): Promise<void>
  update(tenantId: string, reservationId: string, data: Partial<NewReservation>): Promise<void>
}
