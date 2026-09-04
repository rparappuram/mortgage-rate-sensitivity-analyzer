export type MetricTone = 'default' | 'positive' | 'negative' | 'accent' | 'muted'

export function toneForSign(value: number, invert = false): MetricTone {
  if (value === 0) return 'default'
  const positive = invert ? value < 0 : value > 0
  return positive ? 'positive' : 'negative'
}
