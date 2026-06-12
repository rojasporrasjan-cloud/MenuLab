import type { Reservation } from '@core/domain/entities/Reservation'
import type { IReservationRepository } from '@core/domain/repositories/IReservationRepository'

export class ListReservationsByDateUseCase {
  private readonly reservationRepository: IReservationRepository

  constructor(reservationRepository: IReservationRepository) {
    this.reservationRepository = reservationRepository
  }

  /** `date` en formato YYYY-MM-DD. */
  async execute(tenantId: string, date: string): Promise<Reservation[]> {
    return this.reservationRepository.listByDate(tenantId, date)
  }
}
