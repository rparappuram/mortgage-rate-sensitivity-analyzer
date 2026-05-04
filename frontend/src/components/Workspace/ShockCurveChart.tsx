import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ShockedCurvePoint } from '../../types/api';

interface ShockCurveChartProps {
  tenors: ShockedCurvePoint[];
  hasShock: boolean;
}

export function ShockCurveChart({ tenors }: ShockCurveChartProps) {
  const data = tenors.map((t) => ({
    tenor: t.tenor,
    base: +t.base_par.toFixed(3),
    shocked: +t.shocked_zero.toFixed(3),
  }));

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>
        <span>Shocked Curve</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'Base', dashed: true },
            { label: 'Shocked', dashed: false },
          ].map(({ label, dashed }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: 14,
                  height: 0,
                  borderTop: `2px ${dashed ? 'dashed' : 'solid'} var(--color-accent)`,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-faint)' }}>
                {label}
              </span>
            </span>
          ))}
        </div>
      </div>
      <div style={{ height: '160px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="tenor"
              tick={{ fill: 'var(--color-faint)', fontSize: 8, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--color-faint)', fontSize: 8, fontFamily: 'var(--font-mono)' }}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface2)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
              formatter={(v, name) => [
                v != null ? `${(v as number).toFixed(3)}%` : '—',
                (name as string) === 'base' ? 'Base Par' : 'Shocked Zero',
              ]}
            />
            <Line
              type="monotone"
              dataKey="base"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="shocked"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              dot={{ r: 3, fill: 'var(--color-accent)', strokeWidth: 0 }}
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
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '6px',
};
