import { describe, it, expect, vi, afterEach } from 'vitest'
import { greeting } from './datetime'

afterEach(() => vi.useRealTimers())

function atHour(h: number): void {
  vi.useFakeTimers()
  const d = new Date('2026-06-14T00:00:00')
  d.setHours(h, 0, 0, 0)
  vi.setSystemTime(d)
}

describe('greeting', () => {
  it('Buenos días antes del mediodía', () => {
    atHour(9)
    expect(greeting()).toBe('Buenos días')
  })
  it('Buenas tardes por la tarde', () => {
    atHour(15)
    expect(greeting()).toBe('Buenas tardes')
  })
  it('Buenas noches por la noche', () => {
    atHour(21)
    expect(greeting()).toBe('Buenas noches')
  })
})
