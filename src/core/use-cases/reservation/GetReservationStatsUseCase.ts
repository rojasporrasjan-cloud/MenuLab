import type { ReservationStats } from '@core/domain/entities/Reservation'
import { calculateReservationStats } from '@core/domain/entities/Reservation'
import type { IReservationRepository } from '@core/domain/repositories/IReservationRepository'

export class GetReservationStatsUseCase {
  private readonly reservationRepository: IReservationRepository

  constructor(reservationRepository: IReservationRepository) {
    this.reservationRepository = reservationRepository
  }

  /** Estadísticas de las reservas de un día (YYYY-MM-DD). */
  async execute(tenantId: string, date: string): Promise<ReservationStats> {
    const reservations = await this.reservationRepository.listByDate(tenantId, date)
    return calculateReservationStats(reservations)
  }
}
