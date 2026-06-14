import type { IInvoiceRepository } from '@core/domain/repositories/IInvoiceRepository'
import type { Invoice } from '@core/domain/entities/Invoice'

export class ListInvoicesUseCase {
  private readonly invoices: IInvoiceRepository

  constructor(invoices: IInvoiceRepository) {
    this.invoices = invoices
  }

  execute(tenantId: string, max = 50): Promise<Invoice[]> {
    return this.invoices.listRecent(tenantId, max)
  }
}
