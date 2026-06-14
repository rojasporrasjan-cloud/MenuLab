import type { Invoice, NewInvoice, InvoiceStatus } from '../entities/Invoice'

export interface IInvoiceRepository {
  create(invoice: NewInvoice): Promise<Invoice>
  getById(tenantId: string, invoiceId: string): Promise<Invoice | null>
  /** Comprobantes más recientes primero. */
  listRecent(tenantId: string, max: number): Promise<Invoice[]>
  /** Total de comprobantes del tenant — base para el consecutivo. */
  count(tenantId: string): Promise<number>
  /** Avanza el estado (signed/sent/accepted/rejected) al conectar Hacienda. */
  updateStatus(
    tenantId: string,
    invoiceId: string,
    status: InvoiceStatus,
    haciendaResponse: string | null,
  ): Promise<void>
}
