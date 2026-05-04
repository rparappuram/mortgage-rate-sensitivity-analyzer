import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CashflowPoint } from '../../types/api';

interface WaterfallChartProps {
  cashflows: CashflowPoint[];
}

function sample(cfs: CashflowPoint[], every = 12): CashflowPoint[] {
  return cfs.filter((_, i) => i === 0 || (i + 1) % every === 0);
}

function fmtK(v: number): string {
  return `$${(v / 1000).toFixed(0)}k`;
}

export function WaterfallChart({ cashflows }: WaterfallChartProps) {
  const data = sample(cashflows, 12).map((cf) => ({
    name: `M${cf.month}`,
    int: +(cf.interest / 1000).toFixed(1),
    prin: +(cf.principal / 1000).toFixed(1),
    prep: +(cf.prepayment / 1000).toFixed(1),
  }));

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>
        <span>Cashflow Waterfall</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'Int', color: '#e8974e' },
            { label: 'Prin', color: '#5b9cf6' },
            { label: 'Prepay', color: '#3ecf8e' },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 8, height: 8, background: color, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-faint)' }}>
                {label}
              </span>
            </span>
          ))}
        </div>
      </div>
      <div style={{ height: '160px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="20%">
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--color-faint)', fontSize: 8, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-faint)', fontSize: 8, fontFamily: 'var(--font-mono)' }}
              tickFormatter={fmtK}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface2)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
              formatter={(value, name) => [
                value != null ? `$${((value as number) * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—',
                (name as string) === 'int' ? 'Interest' : (name as string) === 'prin' ? 'Principal' : 'Prepayment',
              ]}
            />
            <Bar dataKey="int" stackId="a" fill="#e8974e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="prin" stackId="a" fill="#5b9cf6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="prep" stackId="a" fill="#3ecf8e" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '10px',
  padding: '16px',
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--color-faint)',
  marginBottom: '12px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '6px',
};
