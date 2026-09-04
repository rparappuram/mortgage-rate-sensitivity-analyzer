import { describe, expect, it } from 'vitest'
import { clamp, formatCurrency, formatMonths, formatSignedBps, formatSignedCurrency, parseIsoDate, toIsoDate } from './format'

describe('format helpers', () => {
  it('formats currency without cents', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,568')
  })

  it('signs currency and basis points', () => {
    expect(formatSignedCurrency(2500)).toBe('+$2,500')
    expect(formatSignedCurrency(-2500)).toBe('−$2,500')
    expect(formatSignedBps(41)).toBe('+41 bps')
    expect(formatSignedBps(-12.4, 1)).toBe('−12.4 bps')
  })

  it('formats months as years and months', () => {
    expect(formatMonths(7)).toBe('7 mo')
    expect(formatMonths(24)).toBe('2 yrs')
    expect(formatMonths(27)).toBe('2 yr 3 mo')
  })

  it('round-trips ISO dates without timezone drift', () => {
    expect(toIsoDate(parseIsoDate('2026-09-04'))).toBe('2026-09-04')
  })

  it('clamps values', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-1, 0, 3)).toBe(0)
  })
})
