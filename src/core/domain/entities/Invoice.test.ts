import { describe, it, expect } from 'vitest'
import {
  buildInvoiceLine,
  calculateInvoiceTotals,
  buildConsecutivo,
  buildClave,
  COMPROBANTE_TYPE,
  IVA_RATE,
} from './Invoice'

describe('buildInvoiceLine (IVA incluido en el precio)', () => {
  it('extrae base e IVA de un precio con impuesto incluido', () => {
    // 1130 con IVA → base 1000, IVA 130
    const line = buildInvoiceLine(1, 'Casado', 1, 1130)
    expect(line.subtotal).toBe(1000)
    expect(line.taxAmount).toBe(130)
    expect(line.total).toBe(1130)
    expect(line.taxRate).toBe(IVA_RATE)
  })

  it('multiplica por la cantidad', () => {
    const line = buildInvoiceLine(1, 'Fresco', 2, 1130)
    expect(line.total).toBe(2260)
    expect(line.subtotal).toBe(2000)
    expect(line.taxAmount).toBe(260)
  })
})

describe('calculateInvoiceTotals', () => {
  it('suma base, IVA y total de todas las líneas', () => {
    const totals = calculateInvoiceTotals([
      buildInvoiceLine(1, 'A', 1, 1130),
      buildInvoiceLine(2, 'B', 1, 2260),
    ])
    expect(totals.subtotal).toBe(3000)
    expect(totals.taxTotal).toBe(390)
    expect(totals.total).toBe(3390)
  })
})

describe('buildConsecutivo', () => {
  it('arma 20 dígitos: sucursal+terminal+tipo+secuencia', () => {
    const c = buildConsecutivo('001', '00001', COMPROBANTE_TYPE.tiquete, 42)
    expect(c).toHaveLength(20)
    expect(c).toBe('001' + '00001' + '04' + '0000000042')
  })
})

describe('buildClave', () => {
  it('arma una clave de exactamente 50 dígitos', () => {
    const consecutivo = buildConsecutivo('001', '00001', COMPROBANTE_TYPE.factura, 1)
    const clave = buildClave({
      issuerId: '3101123456',
      consecutivo,
      issuedAt: new Date(2026, 5, 14), // 14 jun 2026
      securityCode: '12345678',
    })
    expect(clave).toHaveLength(50)
    expect(clave.startsWith('506')).toBe(true)
    expect(clave.endsWith('12345678')).toBe(true)
    // país(3)+fecha(6)+cédula(12)+consecutivo(20)+situación(1)+seguridad(8)
    expect(clave).toContain(consecutivo)
  })

  it('rellena la cédula a 12 dígitos', () => {
    const consecutivo = buildConsecutivo('001', '00001', COMPROBANTE_TYPE.factura, 1)
    const clave = buildClave({ issuerId: '12345', consecutivo, issuedAt: new Date(2026, 0, 1), securityCode: '1' })
    expect(clave).toHaveLength(50)
    // cédula 12345 → 000000012345 (12)
    expect(clave).toContain('000000012345')
  })
})
