import { FirestoreInvoiceRepository } from '@infrastructure/repositories/FirestoreInvoiceRepository'
import { CreateInvoiceFromOrderUseCase } from '@core/use-cases/invoice/CreateInvoiceFromOrderUseCase'
import { ListInvoicesUseCase } from '@core/use-cases/invoice/ListInvoicesUseCase'
import type { Order } from '@core/domain/entities/Order'
import type { TenantFiscalConfig } from '@core/domain/entities/FiscalConfig'
import type { Invoice } from '@core/domain/entities/Invoice'

const repo = new FirestoreInvoiceRepository()
const createInvoiceUseCase = new CreateInvoiceFromOrderUseCase(repo)
const listInvoicesUseCase = new ListInvoicesUseCase(repo)

/** Código de seguridad de 8 dígitos con CSPRNG (no Math.random — CWE-327). */
function generateSecurityCode(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String((arr[0] ?? 0) % 100_000_000).padStart(8, '0')
}

export const InvoiceService = {
  list(tenantId: string): Promise<Invoice[]> {
    return listInvoicesUseCase.execute(tenantId)
  },
  async createFromOrder(order: Order, fiscalConfig: TenantFiscalConfig): Promise<Invoice> {
    const sequence = (await repo.count(order.tenantId)) + 1
    return createInvoiceUseCase.execute({
      order,
      fiscalConfig,
      sequence,
      securityCode: generateSecurityCode(),
    })
  },
}
