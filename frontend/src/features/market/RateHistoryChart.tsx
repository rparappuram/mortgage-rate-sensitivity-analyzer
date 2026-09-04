import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistoryPoint } from '../../api/types'
import { ChartTooltip } from '../../components/ui/ChartTooltip'
import { chartColors } from '../../lib/chartColors'
import { formatDate, formatMonth, formatPercent } from '../../lib/format'

interface RateHistoryChartProps {
  history: HistoryPoint[]
  height?: number
}

export function RateHistoryChart({ history, height = 260 }: RateHistoryChartProps) {
  const values = history.flatMap((point) => [point.mortgage_30y, point.treasury_10y ?? point.mortgage_30y])
  const min = Math.floor(Math.min(...values) * 2) / 2 - 0.25
  const max = Math.ceil(Math.max(...values) * 2) / 2 + 0.25
  const tickInterval = Math.max(1, Math.floor(history.length / 6))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={history} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tickMargin={8}
          interval={tickInterval}
          tickFormatter={(value: string) => formatMonth(value)}
        />
        <YAxis domain={[min, max]} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value.toFixed(1)}%`} width={56} />
        <Tooltip
          cursor={{ stroke: chartColors.grid }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as HistoryPoint | undefined
            if (!active || !point) return null
            return (
              <ChartTooltip
                title={formatDate(point.date)}
                rows={[
                  { label: '30-yr mortgage', value: formatPercent(point.mortgage_30y), color: chartColors.warning },
                  { label: '10-yr Treasury', value: point.treasury_10y == null ? '—' : formatPercent(point.treasury_10y), color: chartColors.accent },
                ]}
              />
            )
          }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="plainline"
          formatter={(value: string) => <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{value}</span>}
        />
        <Line type="monotone" dataKey="mortgage_30y" name="30-yr mortgage" stroke={chartColors.warning} strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="treasury_10y" name="10-yr Treasury" stroke={chartColors.accent} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
