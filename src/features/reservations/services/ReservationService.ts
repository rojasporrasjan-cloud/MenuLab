import { FirestoreReservationRepository } from '@infrastructure/repositories/FirestoreReservationRepository'
import { CreateReservationUseCase } from '@core/use-cases/reservation/CreateReservationUseCase'
import { ListReservationsByDateUseCase } from '@core/use-cases/reservation/ListReservationsByDateUseCase'
import { UpdateReservationStatusUseCase } from '@core/use-cases/reservation/UpdateReservationStatusUseCase'
import { GetReservationStatsUseCase } from '@core/use-cases/reservation/GetReservationStatsUseCase'

/**
 * Composition root del feature de reservas.
 * Singleton a nivel de módulo — mismo patrón que OrderService.
 */
const reservationRepository = new FirestoreReservationRepository()

export const ReservationService = {
  createReservation: new CreateReservationUseCase(reservationRepository),
  listReservationsByDate: new ListReservationsByDateUseCase(reservationRepository),
  updateReservationStatus: new UpdateReservationStatusUseCase(reservationRepository),
  getReservationStats: new GetReservationStatsUseCase(reservationRepository),
} as const
