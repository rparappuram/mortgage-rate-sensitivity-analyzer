import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CurveNode } from '../../../api/types'
import { Card } from '../../../components/ui/Card'
import { ChartTooltip } from '../../../components/ui/ChartTooltip'
import { chartColors } from '../../../lib/chartColors'
import { formatPercent } from '../../../lib/format'

interface CurveShockChartProps {
  curve: CurveNode[]
  shocked: boolean
}

export function CurveShockChart({ curve, shocked }: CurveShockChartProps) {
  const values = curve.flatMap((node) => [node.base_zero_rate, node.shocked_zero_rate])
  const min = Math.floor(Math.min(...values) * 2) / 2 - 0.25
  const max = Math.ceil(Math.max(...values) * 2) / 2 + 0.25
  return (
    <Card title="Zero curve" subtitle={shocked ? 'Base versus shocked discount curve' : 'Bootstrapped from Treasury par yields'}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={curve} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis dataKey="tenor" axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis domain={[min, max]} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value.toFixed(1)}%`} width={52} />
          <Tooltip
            cursor={{ stroke: chartColors.grid }}
            content={({ active, payload }) => {
              const node = payload?.[0]?.payload as CurveNode | undefined
              if (!active || !node) return null
              return (
                <ChartTooltip
                  title={node.tenor}
                  rows={[
                    { label: 'Base zero', value: formatPercent(node.base_zero_rate, 3), color: chartColors.accent },
                    ...(shocked ? [{ label: 'Shocked zero', value: formatPercent(node.shocked_zero_rate, 3), color: chartColors.warning }] : []),
                    { label: 'Par yield', value: formatPercent(node.base_par_rate, 2), color: chartColors.muted },
                  ]}
                />
              )
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={24}
            iconType="plainline"
            formatter={(value: string) => <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{value}</span>}
          />
          <Line type="monotone" dataKey="base_zero_rate" name="Base" stroke={chartColors.accent} strokeWidth={2} dot={false} isAnimationActive={false} />
          {shocked && (
            <Line type="monotone" dataKey="shocked_zero_rate" name="Shocked" stroke={chartColors.warning} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
