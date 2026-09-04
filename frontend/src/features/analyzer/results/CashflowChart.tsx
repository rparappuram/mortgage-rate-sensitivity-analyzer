import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AnnualCashflow } from '../../../api/types'
import { Card } from '../../../components/ui/Card'
import { ChartTooltip } from '../../../components/ui/ChartTooltip'
import { chartColors } from '../../../lib/chartColors'
import { formatCompactCurrency, formatCurrency } from '../../../lib/format'

interface CashflowChartProps {
  cashflows: AnnualCashflow[]
  actions?: React.ReactNode
}

export function CashflowChart({ cashflows, actions }: CashflowChartProps) {
  const data = cashflows.map((row) => ({ ...row, label: `Y${row.year}` }))
  return (
    <Card title="Expected cash flows" subtitle="Interest, scheduled principal, and prepayments by year" actions={actions}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }} barCategoryGap="28%">
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} interval={data.length > 16 ? 2 : 0} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(value: number) => formatCompactCurrency(value)} width={60} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as (AnnualCashflow & { label: string }) | undefined
              if (!active || !row) return null
              return (
                <ChartTooltip
                  title={`Year ${row.year}`}
                  rows={[
                    { label: 'Interest', value: formatCurrency(row.interest), color: chartColors.accent },
                    { label: 'Scheduled principal', value: formatCurrency(row.scheduled_principal), color: chartColors.positive },
                    { label: 'Prepayment', value: formatCurrency(row.prepayment), color: chartColors.violet },
                    { label: 'Ending balance', value: formatCurrency(row.ending_balance) },
                  ]}
                />
              )
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={24}
            iconType="circle"
            iconSize={6}
            formatter={(value: string) => <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{value}</span>}
          />
          <Bar dataKey="interest" name="Interest" stackId="cf" fill={chartColors.accent} isAnimationActive={false} />
          <Bar dataKey="scheduled_principal" name="Principal" stackId="cf" fill={chartColors.positive} isAnimationActive={false} />
          <Bar dataKey="prepayment" name="Prepayment" stackId="cf" fill={chartColors.violet} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
