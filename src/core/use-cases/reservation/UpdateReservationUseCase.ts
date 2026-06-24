import type { IReservationRepository } from '@core/domain/repositories/IReservationRepository'
import type { NewReservation } from '@core/domain/entities/Reservation'
import { ValidationError } from '@core/errors/ValidationError'

export interface UpdateReservationInput extends Partial<NewReservation> {
  tenantId: string
  reservationId: string
}

export class UpdateReservationUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async execute(input: UpdateReservationInput): Promise<void> {
    if (!input.tenantId) {
      throw new ValidationError('tenantId', 'La reserva necesita un tenant.')
    }
    if (!input.reservationId) {
      throw new ValidationError('reservationId', 'ID de reserva requerido.')
    }

    const updateData: Partial<NewReservation> = { ...input }
    // @ts-expect-error remove from update payload
    delete updateData.tenantId
    // @ts-expect-error remove from update payload
    delete updateData.reservationId

    if (updateData.customerName) {
      updateData.customerName = updateData.customerName.trim()
      if (!updateData.customerName) throw new ValidationError('customerName', 'El nombre no puede estar vacío.')
    }
    if (updateData.customerPhone) {
      updateData.customerPhone = updateData.customerPhone.trim()
    }
    if (updateData.note !== undefined && updateData.note !== null) {
      updateData.note = updateData.note.trim() || null
    }

    await this.reservationRepository.update(input.tenantId, input.reservationId, updateData)
  }
}
