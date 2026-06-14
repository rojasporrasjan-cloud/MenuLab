import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('combina varias clases', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('ignora valores falsy', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
  it('resuelve conflictos de Tailwind (gana la última)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
  it('soporta clases condicionales por objeto', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })
})
