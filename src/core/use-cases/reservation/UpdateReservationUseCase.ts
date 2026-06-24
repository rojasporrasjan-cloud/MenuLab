import type { IReservationRepository } from '@core/domain/repositories/IReservationRepository'
import type { NewReservation } from '@core/domain/entities/Reservation'
import { ValidationError } from '@core/errors/ValidationError'

export interface UpdateReservationInput extends Partial<NewReservation> {
  tenantId: string
  reservationId: string
}

export class UpdateReservationUseCase {
  private readonly repository: IReservationRepository
  constructor(repository: IReservationRepository) {
    this.repository = repository
  }

  async execute(input: UpdateReservationInput): Promise<void> {
    if (!input.tenantId) {
      throw new ValidationError('tenantId', 'La reserva necesita un tenant.')
    }
    if (!input.reservationId) {
      throw new ValidationError('reservationId', 'ID de reserva requerido.')
    }

    const cleanUpdate = { ...input } as Record<string, unknown>
    delete cleanUpdate.tenantId
    delete cleanUpdate.reservationId

    if (typeof cleanUpdate.customerName === 'string') {
      cleanUpdate.customerName = cleanUpdate.customerName.trim()
      if (!cleanUpdate.customerName) throw new ValidationError('customerName', 'El nombre no puede estar vacío.')
    }
    if (typeof cleanUpdate.customerPhone === 'string') {
      cleanUpdate.customerPhone = cleanUpdate.customerPhone.trim()
    }
    if (cleanUpdate.note !== undefined && cleanUpdate.note !== null) {
      cleanUpdate.note = String(cleanUpdate.note).trim() || null
    }

    await this.repository.update(input.tenantId, input.reservationId, cleanUpdate as unknown as Partial<NewReservation>)
  }
}
