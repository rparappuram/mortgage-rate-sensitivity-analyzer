const currencyWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const currencyCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

export function formatCurrency(value: number): string {
  return currencyWhole.format(value)
}

export function formatCurrencyCents(value: number): string {
  return currencyCents.format(value)
}

export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value)
}

export function formatSignedCurrency(value: number): string {
  const formatted = currencyWhole.format(Math.abs(value))
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`
}

export function formatSignedPercent(value: number, digits = 2): string {
  const formatted = `${Math.abs(value).toFixed(digits)}%`
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}

export function formatBps(value: number, digits = 0): string {
  return `${value.toFixed(digits)} bps`
}

export function formatSignedBps(value: number, digits = 0): string {
  const formatted = `${Math.abs(value).toFixed(digits)} bps`
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}

export function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function formatYears(value: number, digits = 1): string {
  return `${value.toFixed(digits)} yrs`
}

export function formatMonths(months: number): string {
  const whole = Math.round(months)
  const years = Math.floor(whole / 12)
  const remainder = whole % 12
  if (years === 0) return `${remainder} mo`
  if (remainder === 0) return `${years} yr${years === 1 ? '' : 's'}`
  return `${years} yr ${remainder} mo`
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(parseIsoDate(isoDate))
}

export function formatMonth(isoDate: string): string {
  return monthFormatter.format(parseIsoDate(isoDate))
}

export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function toError(value: unknown): Error | null {
  if (value === null || value === undefined) return null
  if (value instanceof Error) return value
  return new Error(String(value))
}
