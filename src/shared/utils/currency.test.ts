import { describe, it, expect } from 'vitest'
import { currencyForLocale, currencySymbol } from './currency'

describe('currencyForLocale', () => {
  it('mapea los locales LATAM soportados a su moneda ISO', () => {
    expect(currencyForLocale('es-CR')).toBe('CRC')
    expect(currencyForLocale('es-MX')).toBe('MXN')
    expect(currencyForLocale('es-ES')).toBe('EUR')
    expect(currencyForLocale('en-US')).toBe('USD')
    expect(currencyForLocale('pt-BR')).toBe('BRL')
  })

  it('cae a CRC con un locale desconocido', () => {
    expect(currencyForLocale('xx-YY')).toBe('CRC')
    expect(currencyForLocale('')).toBe('CRC')
  })
})

describe('currencySymbol', () => {
  it('devuelve un símbolo no vacío para CRC', () => {
    const sym = currencySymbol('es-CR', 'CRC')
    expect(typeof sym).toBe('string')
    expect(sym.length).toBeGreaterThan(0)
  })

  it('devuelve $ para USD en en-US', () => {
    expect(currencySymbol('en-US', 'USD')).toBe('$')
  })
})
