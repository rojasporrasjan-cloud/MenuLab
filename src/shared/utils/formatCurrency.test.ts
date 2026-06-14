import { describe, it, expect } from 'vitest'
import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('formatea un monto con la moneda dada', () => {
    const out = formatCurrency(1500, 'CRC', 'es-CR')
    expect(out).toContain('1')
    expect(out).toContain('500')
  })

  it('no muestra decimales para montos enteros', () => {
    const out = formatCurrency(1000, 'USD', 'en-US')
    expect(out).not.toContain('.00')
  })

  it('respeta hasta 2 decimales', () => {
    expect(formatCurrency(1234.56, 'USD', 'en-US')).toContain('1,234.56')
  })

  it('usa es-CR como locale por defecto', () => {
    const out = formatCurrency(2000, 'CRC')
    expect(out).toContain('2')
  })
})
