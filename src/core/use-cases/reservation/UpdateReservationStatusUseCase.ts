import type { ReservationStatus } from '@core/domain/entities/Reservation'
import type { IReservationRepository } from '@core/domain/repositories/IReservationRepository'

export class UpdateReservationStatusUseCase {
  private readonly reservationRepository: IReservationRepository

  constructor(reservationRepository: IReservationRepository) {
    this.reservationRepository = reservationRepository
  }

  async execute(tenantId: string, reservationId: string, status: ReservationStatus): Promise<void> {
    await this.reservationRepository.updateStatus(tenantId, reservationId, status)
  }
}
