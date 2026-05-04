interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  valueColor?: string;
}

export function MetricCard({ label, value, sub, highlight, valueColor }: MetricCardProps) {
  return (
    <div
      style={{
        background: highlight ? 'rgba(91,156,246,0.08)' : 'var(--color-surface)',
        border: `1px solid ${highlight ? 'rgba(91,156,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '10px',
        padding: '14px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
          color: 'var(--color-faint)',
          marginBottom: '5px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '19px',
          fontWeight: 400,
          lineHeight: 1,
          color: valueColor ?? 'var(--color-text)',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: '10px',
            color: 'var(--color-faint)',
            marginTop: '3px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
