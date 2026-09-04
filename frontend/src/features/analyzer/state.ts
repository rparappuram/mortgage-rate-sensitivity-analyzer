import type { AnalysisRequest, PrepaymentModel, ShockMode } from '../../api/types'
import { clamp, toIsoDate } from '../../lib/format'

export interface AnalyzerInputs {
  originalBalance: number
  currentBalance: number | null
  noteRatePct: number
  termMonths: number
  originationDate: string
  prepaymentModel: PrepaymentModel
  cprPct: number
  asOf: string | null
  spreadBps: number | null
  shockMode: ShockMode
  parallelBps: number
  shortBps: number
  longBps: number
  closingCostsPct: number
  newTermMonths: number
}

export const LIMITS = {
  balance: { min: 10_000, max: 10_000_000 },
  ratePct: { min: 0.5, max: 15 },
  cprPct: { min: 0, max: 60 },
  spreadBps: { min: -100, max: 600 },
  shockBps: { min: -300, max: 300 },
  closingCostsPct: { min: 0, max: 8 },
} as const

export const TERM_OPTIONS = [
  { label: '30 yr', months: 360 },
  { label: '20 yr', months: 240 },
  { label: '15 yr', months: 180 },
  { label: '10 yr', months: 120 },
] as const

const PREPAYMENT_MODELS: PrepaymentModel[] = ['refinance_incentive', 'constant']
const SHOCK_MODES: ShockMode[] = ['parallel', 'twist', 'steepener']

function defaultOriginationDate(): string {
  const today = new Date()
  return toIsoDate(new Date(today.getFullYear() - 3, today.getMonth(), 1))
}

export const DEFAULT_INPUTS: AnalyzerInputs = {
  originalBalance: 400_000,
  currentBalance: null,
  noteRatePct: 6.5,
  termMonths: 360,
  originationDate: defaultOriginationDate(),
  prepaymentModel: 'refinance_incentive',
  cprPct: 6,
  asOf: null,
  spreadBps: null,
  shockMode: 'parallel',
  parallelBps: 0,
  shortBps: 0,
  longBps: 0,
  closingCostsPct: 2,
  newTermMonths: 360,
}

const PARAM_KEYS: Record<keyof AnalyzerInputs, string> = {
  originalBalance: 'balance',
  currentBalance: 'current',
  noteRatePct: 'rate',
  termMonths: 'term',
  originationDate: 'origin',
  prepaymentModel: 'prepay',
  cprPct: 'cpr',
  asOf: 'asof',
  spreadBps: 'spread',
  shockMode: 'shock',
  parallelBps: 'parallel',
  shortBps: 'short',
  longBps: 'long',
  closingCostsPct: 'costs',
  newTermMonths: 'newterm',
}

export function toRequest(inputs: AnalyzerInputs): AnalysisRequest {
  return {
    loan: {
      original_balance: inputs.originalBalance,
      current_balance: inputs.currentBalance,
      note_rate_pct: inputs.noteRatePct,
      term_months: inputs.termMonths,
      origination_date: inputs.originationDate,
    },
    prepayment: { model: inputs.prepaymentModel, cpr_pct: inputs.cprPct },
    valuation: { as_of: inputs.asOf, spread_bps: inputs.spreadBps },
    shock: {
      mode: inputs.shockMode,
      parallel_bps: inputs.shockMode === 'parallel' ? inputs.parallelBps : 0,
      short_bps: inputs.shockMode === 'twist' ? inputs.shortBps : 0,
      long_bps: inputs.shockMode === 'parallel' ? 0 : inputs.longBps,
    },
    refinance: { closing_costs_pct: inputs.closingCostsPct, new_term_months: inputs.newTermMonths },
  }
}

export function serializeInputs(inputs: AnalyzerInputs): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of Object.keys(PARAM_KEYS) as (keyof AnalyzerInputs)[]) {
    const value = inputs[key]
    if (value === null || value === DEFAULT_INPUTS[key]) continue
    params.set(PARAM_KEYS[key], String(value))
  }
  return params
}

export function parseInputs(params: URLSearchParams): AnalyzerInputs {
  const number = (key: keyof AnalyzerInputs, min: number, max: number): number | null => {
    const raw = params.get(PARAM_KEYS[key])
    if (raw === null || raw === '') return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? clamp(parsed, min, max) : null
  }
  const isoDate = (key: keyof AnalyzerInputs): string | null => {
    const raw = params.get(PARAM_KEYS[key])
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
  }
  const oneOf = <T extends string>(key: keyof AnalyzerInputs, options: T[]): T | null => {
    const raw = params.get(PARAM_KEYS[key])
    return raw && (options as string[]).includes(raw) ? (raw as T) : null
  }
  const term = number('termMonths', 12, 480)
  const newTerm = number('newTermMonths', 12, 480)
  return {
    originalBalance: number('originalBalance', LIMITS.balance.min, LIMITS.balance.max) ?? DEFAULT_INPUTS.originalBalance,
    currentBalance: number('currentBalance', 1, LIMITS.balance.max),
    noteRatePct: number('noteRatePct', LIMITS.ratePct.min, LIMITS.ratePct.max) ?? DEFAULT_INPUTS.noteRatePct,
    termMonths: term === null ? DEFAULT_INPUTS.termMonths : Math.round(term),
    originationDate: isoDate('originationDate') ?? DEFAULT_INPUTS.originationDate,
    prepaymentModel: oneOf('prepaymentModel', PREPAYMENT_MODELS) ?? DEFAULT_INPUTS.prepaymentModel,
    cprPct: number('cprPct', LIMITS.cprPct.min, LIMITS.cprPct.max) ?? DEFAULT_INPUTS.cprPct,
    asOf: isoDate('asOf'),
    spreadBps: number('spreadBps', LIMITS.spreadBps.min, LIMITS.spreadBps.max),
    shockMode: oneOf('shockMode', SHOCK_MODES) ?? DEFAULT_INPUTS.shockMode,
    parallelBps: number('parallelBps', LIMITS.shockBps.min, LIMITS.shockBps.max) ?? 0,
    shortBps: number('shortBps', LIMITS.shockBps.min, LIMITS.shockBps.max) ?? 0,
    longBps: number('longBps', LIMITS.shockBps.min, LIMITS.shockBps.max) ?? 0,
    closingCostsPct:
      number('closingCostsPct', LIMITS.closingCostsPct.min, LIMITS.closingCostsPct.max) ?? DEFAULT_INPUTS.closingCostsPct,
    newTermMonths: newTerm === null ? DEFAULT_INPUTS.newTermMonths : Math.round(newTerm),
  }
}
