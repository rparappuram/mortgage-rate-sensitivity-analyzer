import type { RateCurveResponse } from '../../types/api';

interface RateCardsProps {
  data: RateCurveResponse;
}

interface RateCardDef {
  key: string;
  label: string;
  getValue: (d: RateCurveResponse) => string;
  getSub: (d: RateCurveResponse) => string;
  getColor: (d: RateCurveResponse) => string;
}

const CARDS: RateCardDef[] = [
  {
    key: '3m',
    label: '3M Treasury',
    getValue: (d) => fmtRate(d.par_rates['3M']),
    getSub: () => 'fed funds proxy',
    getColor: () => 'var(--color-text)',
  },
  {
    key: '2y',
    label: '2Y Treasury',
    getValue: (d) => fmtRate(d.par_rates['2Y']),
    getSub: (d) => {
      const diff = ((d.par_rates['2Y'] ?? 0) - (d.par_rates['3M'] ?? 0)) * 100;
      return `vs 3M: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`;
    },
    getColor: () => 'var(--color-text)',
  },
  {
    key: '10y',
    label: '10Y Treasury',
    getValue: (d) => fmtRate(d.par_rates['10Y']),
    getSub: () => '2020: 4.41%',
    getColor: () => 'var(--color-text)',
  },
  {
    key: '30y',
    label: '30Y Treasury',
    getValue: (d) => fmtRate(d.par_rates['30Y']),
    getSub: (d) => {
      const diff = ((d.par_rates['30Y'] ?? 0) - (d.par_rates['10Y'] ?? 0)) * 100;
      return `vs 10Y: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`;
    },
    getColor: () => 'var(--color-text)',
  },
  {
    key: 'spread',
    label: '2Y–10Y Spread',
    getValue: (d) => `${d.spread_2y10y >= 0 ? '+' : ''}${d.spread_2y10y.toFixed(2)}%`,
    getSub: (d) => (d.is_inverted ? 'inverted' : 'normal'),
    getColor: (d) => (d.is_inverted ? 'var(--color-red)' : 'var(--color-green)'),
  },
];

function fmtRate(r: number | undefined): string {
  if (r == null) return '—';
  return `${(r * 100).toFixed(2)}%`;
}

const ACCENT_COLORS: Record<string, string> = {
  '3m': 'var(--color-accent)',
  '2y': 'var(--color-accent)',
  '10y': 'var(--color-accent)',
  '30y': 'var(--color-accent)',
  spread: 'var(--color-red)',
};

export function RateCards({ data }: RateCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '1px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '32px',
      }}
    >
      {CARDS.map((card) => (
        <div
          key={card.key}
          style={{
            background: 'var(--color-surface)',
            padding: '18px 20px 14px',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.08em',
              color: 'var(--color-faint)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '26px',
              fontWeight: 400,
              lineHeight: 1,
              marginBottom: '5px',
              color: card.getColor(data),
            }}
          >
            {card.getValue(data)}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: card.key === 'spread' && data.is_inverted ? 'var(--color-red)' : 'var(--color-faint)',
            }}
          >
            {card.getSub(data)}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '20px',
              right: '20px',
              height: '1px',
              background: ACCENT_COLORS[card.key] ?? 'var(--color-accent)',
            }}
          />
        </div>
      ))}
    </div>
  );
}
