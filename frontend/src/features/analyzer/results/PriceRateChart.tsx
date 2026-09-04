import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PriceCurvePoint } from '../../../api/types'
import { Card } from '../../../components/ui/Card'
import { ChartTooltip } from '../../../components/ui/ChartTooltip'
import { chartColors } from '../../../lib/chartColors'
import { formatNumber, formatSignedBps } from '../../../lib/format'

interface PriceRateChartProps {
  points: PriceCurvePoint[]
  basePrice: number
  shockBps: number | null
  shockedPrice: number | null
}

export function PriceRateChart({ points, basePrice, shockBps, shockedPrice }: PriceRateChartProps) {
  const prices = points.map((point) => point.price)
  const min = Math.floor(Math.min(...prices)) - 1
  const max = Math.ceil(Math.max(...prices)) + 1
  return (
    <Card title="Price vs. rate move" subtitle="Value across parallel shocks; the bend is convexity">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis
            dataKey="shock_bps"
            type="number"
            domain={[-300, 300]}
            ticks={[-300, -200, -100, 0, 100, 200, 300]}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={(value: number) => (value === 0 ? '0' : formatSignedBps(value).replace(' bps', ''))}
          />
          <YAxis domain={[min, max]} axisLine={false} tickLine={false} tickFormatter={(value: number) => value.toFixed(0)} width={44} />
          <Tooltip
            cursor={{ stroke: chartColors.grid }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as PriceCurvePoint | undefined
              if (!active || !point) return null
              return <ChartTooltip title={point.shock_bps === 0 ? 'Base' : formatSignedBps(point.shock_bps)} rows={[{ label: 'Price', value: formatNumber(point.price, 2), color: chartColors.accent }]} />
            }}
          />
          <ReferenceLine y={basePrice} stroke={chartColors.grid} strokeDasharray="3 3" />
          <ReferenceLine x={0} stroke={chartColors.grid} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="price" stroke={chartColors.accent} strokeWidth={2} dot={false} isAnimationActive={false} />
          {shockBps !== null && shockedPrice !== null && <ReferenceDot x={shockBps} y={shockedPrice} r={5} fill={chartColors.warning} stroke="none" />}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
