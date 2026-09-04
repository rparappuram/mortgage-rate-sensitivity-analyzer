import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, parseInputs, serializeInputs, toRequest } from './state'

describe('analyzer state', () => {
  it('serializes only non-default inputs', () => {
    const params = serializeInputs({ ...DEFAULT_INPUTS, noteRatePct: 7.25, parallelBps: 100 })
    expect(params.toString()).toBe('rate=7.25&parallel=100')
  })

  it('parses and clamps query parameters', () => {
    const inputs = parseInputs(new URLSearchParams('balance=999999999&rate=abc&term=180&shock=twist&long=50&origin=2020-02-01'))
    expect(inputs.originalBalance).toBe(10_000_000)
    expect(inputs.noteRatePct).toBe(DEFAULT_INPUTS.noteRatePct)
    expect(inputs.termMonths).toBe(180)
    expect(inputs.shockMode).toBe('twist')
    expect(inputs.longBps).toBe(50)
    expect(inputs.originationDate).toBe('2020-02-01')
  })

  it('round-trips through the URL', () => {
    const original = { ...DEFAULT_INPUTS, currentBalance: 250_000, spreadBps: 150, asOf: '2024-06-14' }
    expect(parseInputs(serializeInputs(original))).toEqual(original)
  })

  it('only sends the shock fields that apply to the selected shape', () => {
    const request = toRequest({ ...DEFAULT_INPUTS, shockMode: 'steepener', parallelBps: 100, shortBps: 25, longBps: 50 })
    expect(request.shock).toEqual({ mode: 'steepener', parallel_bps: 0, short_bps: 0, long_bps: 50 })
  })
})
