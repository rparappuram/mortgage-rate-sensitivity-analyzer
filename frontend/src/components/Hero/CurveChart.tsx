import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RateCurveResponse } from '../../types/api';

interface CurveChartProps {
  data: RateCurveResponse;
}

const TENOR_ORDER = ['1M', '2M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];

function buildChartData(data: RateCurveResponse) {
  return TENOR_ORDER.filter(
    (t) => data.par_rates[t] != null || data.zero_rates[t] != null,
  ).map((tenor) => ({
    tenor,
    par: data.par_rates[tenor] != null ? +(data.par_rates[tenor] * 100).toFixed(3) : null,
    zero: data.zero_rates[tenor] != null ? +(data.zero_rates[tenor] * 100).toFixed(3) : null,
  }));
}

export function CurveChart({ data }: CurveChartProps) {
  const chartData = buildChartData(data);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-faint)',
            }}
          >
            Par vs. Zero (Bootstrapped)
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--color-accent)',
            }}
          >
            {data.date}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          {[
            { label: 'Par', solid: true },
            { label: 'Zero', solid: false },
          ].map(({ label, solid }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--color-faint)',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '0',
                  borderTop: `2px ${solid ? 'solid' : 'dashed'} var(--color-accent)`,
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '6px 24px 18px', height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="tenor"
              tick={{ fill: 'var(--color-faint)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--color-faint)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface2)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
              labelStyle={{ color: 'var(--color-faint)', marginBottom: '4px' }}
              formatter={(value, name) => [
                value != null ? `${(value as number).toFixed(3)}%` : '—',
                (name as string) === 'par' ? 'Par' : 'Zero',
              ]}
            />
            <Line
              type="monotone"
              dataKey="par"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              dot={{ r: 3, fill: 'var(--color-accent)', strokeWidth: 0 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="zero"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
