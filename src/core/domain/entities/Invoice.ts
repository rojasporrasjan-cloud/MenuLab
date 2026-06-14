import type { Order } from './Order'

// ─── Constantes fiscales (Costa Rica · Hacienda v4.4) ───────────────────────────

/** IVA general de Costa Rica. */
export const IVA_RATE = 0.13

/** Tipo de comprobante electrónico (códigos oficiales de Hacienda). */
export const COMPROBANTE_TYPE = {
  factura: '01', // Factura electrónica (con datos del cliente)
  tiquete: '04', // Tiquete electrónico (consumidor final, sin cédula)
} as const
export type ComprobanteType = (typeof COMPROBANTE_TYPE)[keyof typeof COMPROBANTE_TYPE]

/** Situación del comprobante: 1 normal, 2 contingencia, 3 sin internet. */
export const COMPROBANTE_SITUACION = { normal: '1', contingencia: '2', sinInternet: '3' } as const
export type ComprobanteSituacion = (typeof COMPROBANTE_SITUACION)[keyof typeof COMPROBANTE_SITUACION]

export const INVOICE_STATUS = {
  draft: 'draft',       // generado, sin firmar
  signed: 'signed',     // XML firmado (XAdES) — pendiente de conectar
  sent: 'sent',         // enviado a Hacienda
  accepted: 'accepted', // aceptado por Hacienda
  rejected: 'rejected', // rechazado por Hacienda
} as const
export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS]

// ─── Líneas y totales ───────────────────────────────────────────────────────────

export interface InvoiceLine {
  readonly lineNumber: number
  readonly description: string
  readonly quantity: number
  /** Precio unitario tal cual lo paga el cliente (IVA incluido — convención CR). */
  readonly unitPrice: number
  /** Base imponible de la línea (sin IVA). */
  readonly subtotal: number
  readonly taxRate: number
  readonly taxAmount: number
  /** Total de la línea con IVA. */
  readonly total: number
}

export interface InvoiceTotals {
  readonly subtotal: number
  readonly taxTotal: number
  readonly total: number
}

export interface Invoice {
  readonly id: string
  readonly tenantId: string
  readonly type: ComprobanteType
  /** 20 dígitos — sucursal+terminal+tipo+secuencia. */
  readonly consecutivo: string
  /** 50 dígitos — clave única del comprobante. */
  readonly clave: string
  readonly status: InvoiceStatus
  readonly orderId: string | null
  readonly currency: string
  readonly lines: readonly InvoiceLine[]
  readonly subtotal: number
  readonly taxTotal: number
  readonly total: number
  readonly customerName: string | null
  /** Cédula del cliente (factura) o null (tiquete a consumidor final). */
  readonly customerId: string | null
  readonly issuedAt: Date
  readonly createdAt: Date
  /** Respuesta de Hacienda cuando se conecte el firmado/envío. */
  readonly haciendaResponse: string | null
}

export type NewInvoice = Omit<Invoice, 'id' | 'createdAt'>

// ─── Helpers de cálculo ─────────────────────────────────────────────────────────

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Solo dígitos, rellenado con ceros a la izquierda y recortado a `length`. */
function padDigits(value: string | number, length: number): string {
  return String(value).replace(/\D/g, '').padStart(length, '0').slice(-length)
}

/**
 * Construye una línea del comprobante a partir del precio que paga el cliente.
 * En CR los precios del menú normalmente YA incluyen IVA, así que extraemos la
 * base imponible (sin IVA) y el impuesto.
 */
export function buildInvoiceLine(
  lineNumber: number,
  description: string,
  quantity: number,
  grossUnitPrice: number,
  taxRate: number = IVA_RATE,
): InvoiceLine {
  const grossLine = round2(quantity * grossUnitPrice)
  const subtotal = round2(grossLine / (1 + taxRate))
  const taxAmount = round2(grossLine - subtotal)
  return { lineNumber, description, quantity, unitPrice: grossUnitPrice, subtotal, taxRate, taxAmount, total: grossLine }
}

export function calculateInvoiceTotals(lines: readonly InvoiceLine[]): InvoiceTotals {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.subtotal, 0))
  const taxTotal = round2(lines.reduce((sum, l) => sum + l.taxAmount, 0))
  const total = round2(lines.reduce((sum, l) => sum + l.total, 0))
  return { subtotal, taxTotal, total }
}

/** Convierte los ítems de un pedido en líneas de comprobante. */
export function invoiceLinesFromOrder(order: Order): InvoiceLine[] {
  return order.items.map((item, index) =>
    buildInvoiceLine(index + 1, item.dishName, item.quantity, item.unitPrice),
  )
}

// ─── Generación de consecutivo y clave (formato oficial Hacienda) ───────────────

/**
 * Consecutivo de 20 dígitos: sucursal(3) + terminal(5) + tipo(2) + secuencia(10).
 */
export function buildConsecutivo(
  branch: string,
  terminal: string,
  type: ComprobanteType,
  sequence: number,
): string {
  return padDigits(branch, 3) + padDigits(terminal, 5) + type + padDigits(sequence, 10)
}

export interface BuildClaveInput {
  /** Cédula del emisor (solo dígitos). */
  readonly issuerId: string
  /** Consecutivo de 20 dígitos (de buildConsecutivo). */
  readonly consecutivo: string
  readonly issuedAt: Date
  readonly situacion?: ComprobanteSituacion
  /** Código de seguridad de 8 dígitos (aleatorio por comprobante). */
  readonly securityCode: string
}

/**
 * Clave de 50 dígitos:
 * país(3=506) + día(2) + mes(2) + año(2) + cédula(12) + consecutivo(20) +
 * situación(1) + códigoSeguridad(8) = 50.
 */
export function buildClave(input: BuildClaveInput): string {
  const dd = padDigits(input.issuedAt.getDate(), 2)
  const mm = padDigits(input.issuedAt.getMonth() + 1, 2)
  const yy = padDigits(input.issuedAt.getFullYear() % 100, 2)
  const situacion = input.situacion ?? COMPROBANTE_SITUACION.normal
  return (
    '506' +
    dd + mm + yy +
    padDigits(input.issuerId, 12) +
    input.consecutivo +
    situacion +
    padDigits(input.securityCode, 8)
  )
}
