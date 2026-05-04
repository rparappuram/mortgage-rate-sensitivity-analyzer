import type { PositionResponse } from '../../types/api';

interface ShockImpactProps {
  data: PositionResponse;
  basePrice: number;
}

function sign(v: number, positive: string, negative: string, zero: string): string {
  if (v > 0) return positive;
  if (v < 0) return negative;
  return zero;
}

export function ShockImpact({ data, basePrice }: ShockImpactProps) {
  const pricePct = data.price_change_pct;
  const dollarPnl = data.dollar_pnl;
  const dv01Shock = data.dv01_shock;

  return (
    <div>
      <div style={sectionLabelStyle}>Shock Impact</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <ImpactCard
          label="Price Change"
          value={`${pricePct >= 0 ? '+' : ''}${pricePct.toFixed(2)}%`}
          sub={`${basePrice.toFixed(2)} → ${(basePrice + pricePct).toFixed(2)}`}
          color={sign(pricePct, 'var(--color-green)', 'var(--color-red)', 'var(--color-text)')}
          bgColor={sign(pricePct, 'var(--color-green-dim)', 'var(--color-red-dim)', '')}
          borderColor={sign(
            pricePct,
            'rgba(62,207,142,0.2)',
            'rgba(240,96,96,0.22)',
            'rgba(255,255,255,0.06)',
          )}
        />
        <ImpactCard
          label="Dollar P&L"
          value={`${dollarPnl >= 0 ? '+' : ''}$${Math.round(dollarPnl).toLocaleString()}`}
          sub="on current balance"
          color={sign(dollarPnl, 'var(--color-green)', 'var(--color-red)', 'var(--color-text)')}
          bgColor={sign(dollarPnl, 'var(--color-green-dim)', 'var(--color-red-dim)', '')}
          borderColor={sign(
            dollarPnl,
            'rgba(62,207,142,0.2)',
            'rgba(240,96,96,0.22)',
            'rgba(255,255,255,0.06)',
          )}
        />
        <ImpactCard
          label="DV01 × Shock"
          value={`${dv01Shock >= 0 ? '+' : ''}$${Math.round(dv01Shock).toLocaleString()}`}
          sub={`$${Math.round(data.dv01).toLocaleString()} × bps`}
          color="var(--color-text)"
          bgColor=""
          borderColor="rgba(255,255,255,0.06)"
        />
      </div>
    </div>
  );
}

function ImpactCard({
  label,
  value,
  sub,
  color,
  bgColor,
  borderColor,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div
      style={{
        background: bgColor || 'var(--color-surface)',
        border: `1px solid ${borderColor}`,
        borderRadius: '10px',
        padding: '14px',
        flex: 1,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-faint)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '24px',
          fontWeight: 400,
          lineHeight: 1,
          color,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-faint)',
          marginTop: '3px',
        }}
      >
        {sub}
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
