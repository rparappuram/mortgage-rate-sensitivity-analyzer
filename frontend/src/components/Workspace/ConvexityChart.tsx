import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PriceYieldPoint } from '../../types/api';

interface ConvexityChartProps {
  data: PriceYieldPoint[];
  currentShockBps: number;
}

export function ConvexityChart({ data, currentShockBps }: ConvexityChartProps) {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>Price / Yield</div>
      <div style={{ height: '160px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="shock_bps"
              tick={{ fill: 'var(--color-faint)', fontSize: 8, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
              ticks={[-300, -150, 0, 150, 300]}
              label={{
                value: 'Shock (bps)',
                position: 'insideBottomRight',
                offset: -4,
                fill: 'var(--color-faint)',
                fontSize: 8,
                fontFamily: 'var(--font-mono)',
              }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--color-faint)', fontSize: 8, fontFamily: 'var(--font-mono)' }}
              tickFormatter={(v) => v.toFixed(0)}
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
              formatter={(v) => [v != null ? `${(v as number).toFixed(2)}` : '—', 'Price']}
              labelFormatter={(l) => `${(l as number) > 0 ? '+' : ''}${l} bps`}
            />
            <ReferenceLine
              x={currentShockBps}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          </LineChart>
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
};
