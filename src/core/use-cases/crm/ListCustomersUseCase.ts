import type { Customer } from '@core/domain/entities/Customer'
import type { ICustomerRepository } from '@core/domain/repositories/ICustomerRepository'

export class ListCustomersUseCase {
  private readonly customerRepository: ICustomerRepository

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository
  }

  async execute(tenantId: string): Promise<Customer[]> {
    return this.customerRepository.list(tenantId)
  }
}
