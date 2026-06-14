import type { IInvoiceRepository } from '@core/domain/repositories/IInvoiceRepository'
import type { Order } from '@core/domain/entities/Order'
import type { TenantFiscalConfig } from '@core/domain/entities/FiscalConfig'
import type { ComprobanteType, Invoice, NewInvoice } from '@core/domain/entities/Invoice'
import {
  COMPROBANTE_TYPE,
  INVOICE_STATUS,
  invoiceLinesFromOrder,
  calculateInvoiceTotals,
  buildConsecutivo,
  buildClave,
} from '@core/domain/entities/Invoice'
import { ValidationError } from '@core/errors/ValidationError'

export interface CreateInvoiceFromOrderInput {
  readonly order: Order
  readonly fiscalConfig: TenantFiscalConfig
  /** Secuencia para el consecutivo (la provee el repo/servicio). */
  readonly sequence: number
  /** Código de seguridad de 8 dígitos (aleatorio). */
  readonly securityCode: string
  /** Por defecto tiquete (consumidor final). */
  readonly type?: ComprobanteType
}

/**
 * Genera un comprobante electrónico (borrador) a partir de un pedido: arma las
 * líneas con IVA, totales, consecutivo y clave. NO firma ni envía a Hacienda —
 * eso se conecta después (necesita certificado + OSE/PSE).
 */
export class CreateInvoiceFromOrderUseCase {
  private readonly invoices: IInvoiceRepository

  constructor(invoices: IInvoiceRepository) {
    this.invoices = invoices
  }

  execute(input: CreateInvoiceFromOrderInput): Promise<Invoice> {
    const { order, fiscalConfig } = input
    if (fiscalConfig.idNumber.replace(/\D/g, '').length === 0) {
      throw new ValidationError('fiscalConfig', 'Falta la cédula del emisor para facturar.')
    }

    const type = input.type ?? COMPROBANTE_TYPE.tiquete
    const issuedAt = new Date()
    const lines = invoiceLinesFromOrder(order)
    const totals = calculateInvoiceTotals(lines)
    const consecutivo = buildConsecutivo(fiscalConfig.branch, fiscalConfig.terminal, type, input.sequence)
    const clave = buildClave({
      issuerId: fiscalConfig.idNumber,
      consecutivo,
      issuedAt,
      securityCode: input.securityCode,
    })

    const invoice: NewInvoice = {
      tenantId: order.tenantId,
      type,
      consecutivo,
      clave,
      status: INVOICE_STATUS.draft,
      orderId: order.id,
      currency: order.currency,
      lines,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      customerName: order.customerName,
      customerId: null,
      issuedAt,
      haciendaResponse: null,
    }

    return this.invoices.create(invoice)
  }
}
