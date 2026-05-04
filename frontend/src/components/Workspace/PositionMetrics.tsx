import type { PositionResponse } from '../../types/api';
import { MetricCard } from '../shared/MetricCard';

interface PositionMetricsProps {
  data: PositionResponse;
}

function fmt$(v: number): string {
  return `$${Math.round(v).toLocaleString('en-US')}`;
}

function fmtPrice(v: number): string {
  return v.toFixed(2);
}

export function PositionMetrics({ data }: PositionMetricsProps) {
  return (
    <div>
      <div style={sectionLabelStyle}>Position</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
        }}
      >
        <MetricCard
          label="Present Value"
          value={fmt$(data.present_value)}
          sub={`at ${data.price.toFixed(2)}`}
          highlight
        />
        <MetricCard
          label="Price"
          value={fmtPrice(data.price)}
          sub="% of balance"
          highlight
        />
        <MetricCard
          label="Current Balance"
          value={fmt$(data.current_balance)}
          sub="current outstanding balance"
        />
        <MetricCard
          label="WAL"
          value={`${data.wal_years.toFixed(1)} yr`}
          sub="weighted avg life"
        />
        <MetricCard
          label="Duration"
          value={data.modified_duration.toFixed(2)}
          sub="modified, yrs"
        />
        <MetricCard
          label="DV01"
          value={`$${Math.round(data.dv01).toLocaleString()}`}
          sub="$ per 1bp"
        />
        <MetricCard
          label="Convexity"
          value={data.convexity.toFixed(2)}
          sub={data.convexity < 0 ? 'negative MBS' : 'positive'}
        />
        <MetricCard
          label="Coupon Spread"
          value={`+${data.coupon_spread_vs_10y.toFixed(2)}%`}
          sub="vs. 10Y par"
        />
      </div>
    </div>
  );
}



const sectionLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-faint)',
  marginBottom: '10px',
};
