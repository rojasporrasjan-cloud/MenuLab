import { describe, it, expect } from 'vitest'
import { slugify, uniqueSlug } from './slug'

describe('slugify', () => {
  it('convierte texto con acentos y símbolos a slug', () => {
    expect(slugify('Soda La Rústica!')).toBe('soda-la-rustica')
  })
  it('colapsa espacios y no-alfanuméricos en un guion', () => {
    expect(slugify('  Hola   Mundo  ')).toBe('hola-mundo')
  })
  it('recorta guiones de los extremos', () => {
    expect(slugify('---abc---')).toBe('abc')
  })
  it('limita a 40 caracteres', () => {
    expect(slugify('a'.repeat(100)).length).toBeLessThanOrEqual(40)
  })
  it('devuelve cadena vacía si no hay alfanuméricos', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('uniqueSlug', () => {
  it('mantiene la base y añade un sufijo de 7 caracteres', () => {
    expect(uniqueSlug('Soda La Rústica')).toMatch(/^soda-la-rustica-[a-z0-9]{7}$/)
  })
  it('usa "restaurante" como base si el nombre no deja slug', () => {
    expect(uniqueSlug('!!!')).toMatch(/^restaurante-[a-z0-9]{7}$/)
  })
  it('genera slugs distintos en llamadas sucesivas', () => {
    expect(uniqueSlug('Test')).not.toBe(uniqueSlug('Test'))
  })
})
