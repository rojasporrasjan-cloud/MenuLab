import type { NewReservation, Reservation } from '@core/domain/entities/Reservation'
import type { IReservationRepository } from '@core/domain/repositories/IReservationRepository'
import { ValidationError } from '@core/errors/ValidationError'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/

export class CreateReservationUseCase {
  private readonly reservationRepository: IReservationRepository

  constructor(reservationRepository: IReservationRepository) {
    this.reservationRepository = reservationRepository
  }

  async execute(input: NewReservation): Promise<Reservation> {
    if (!input.tenantId) {
      throw new ValidationError('tenantId', 'La reserva necesita un tenant.')
    }
    if (!input.customerName.trim()) {
      throw new ValidationError('customerName', 'El nombre es obligatorio.')
    }
    if (!input.customerPhone.trim()) {
      throw new ValidationError('customerPhone', 'El teléfono es obligatorio.')
    }
    if (!DATE_PATTERN.test(input.date)) {
      throw new ValidationError('date', 'La fecha debe tener formato YYYY-MM-DD.')
    }
    if (!TIME_PATTERN.test(input.time)) {
      throw new ValidationError('time', 'La hora debe tener formato HH:MM.')
    }
    if (input.partySize < 1) {
      throw new ValidationError('partySize', 'La reserva debe ser para al menos una persona.')
    }

    return this.reservationRepository.create({
      ...input,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
    })
  }
}
