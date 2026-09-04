import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TenorRate } from '../../api/types'
import { ChartTooltip } from '../../components/ui/ChartTooltip'
import { chartColors } from '../../lib/chartColors'
import { formatPercent } from '../../lib/format'

interface YieldCurveChartProps {
  tenors: TenorRate[]
  height?: number
}

const series = [
  { key: 'par_rate', label: 'Par yield', color: chartColors.accent, dash: undefined },
  { key: 'zero_rate', label: 'Zero (spot)', color: chartColors.positive, dash: '5 4' },
  { key: 'forward_rate', label: 'Forward', color: chartColors.violet, dash: '2 4' },
] as const

export function YieldCurveChart({ tenors, height = 260 }: YieldCurveChartProps) {
  const values = tenors.flatMap((tenor) => [tenor.par_rate, tenor.zero_rate, tenor.forward_rate])
  const min = Math.floor(Math.min(...values) * 4) / 4 - 0.25
  const max = Math.ceil(Math.max(...values) * 4) / 4 + 0.25

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={tenors} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="tenor" axisLine={false} tickLine={false} tickMargin={8} />
        <YAxis domain={[min, max]} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value.toFixed(2)}%`} width={56} />
        <Tooltip
          cursor={{ stroke: chartColors.grid }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as TenorRate | undefined
            if (!active || !point) return null
            return (
              <ChartTooltip
                title={`${point.tenor} · ${point.years.toFixed(2)} yrs`}
                rows={series.map((item) => ({ label: item.label, value: formatPercent(point[item.key], 3), color: item.color }))}
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
        {series.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={item.color}
            strokeWidth={item.key === 'par_rate' ? 2.2 : 1.6}
            strokeDasharray={item.dash}
            dot={item.key === 'par_rate' ? { r: 3, fill: item.color, strokeWidth: 0 } : false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
