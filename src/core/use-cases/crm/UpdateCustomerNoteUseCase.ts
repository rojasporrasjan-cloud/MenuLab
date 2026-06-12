import type { ICustomerRepository } from '@core/domain/repositories/ICustomerRepository'

export class UpdateCustomerNoteUseCase {
  private readonly customerRepository: ICustomerRepository

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository
  }

  async execute(tenantId: string, customerId: string, note: string): Promise<void> {
    await this.customerRepository.updateNote(tenantId, customerId, note.trim() || null)
  }
}
