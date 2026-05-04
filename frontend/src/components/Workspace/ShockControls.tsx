import { Pill } from '../shared/Pill';

interface ShockControlsProps {
  mode: 'parallel' | 'twist' | 'steepener';
  onModeChange: (m: 'parallel' | 'twist' | 'steepener') => void;
  parallelBps: number;
  onParallelBpsChange: (v: number) => void;
  shortBps: number;
  onShortBpsChange: (v: number) => void;
  longBps: number;
  onLongBpsChange: (v: number) => void;
}

export function ShockControls({
  mode,
  onModeChange,
  parallelBps,
  onParallelBpsChange,
  shortBps,
  onShortBpsChange,
  longBps,
  onLongBpsChange,
}: ShockControlsProps) {
  const shockColor =
    parallelBps > 0 || (mode !== 'parallel' && longBps > 0)
      ? 'var(--color-red)'
      : parallelBps < 0 || (mode !== 'parallel' && longBps < 0)
        ? 'var(--color-green)'
        : 'var(--color-faint)';

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={sepStyle} />
      <div style={sectionTitleStyle}>Rate Shock</div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {(['Parallel', 'Twist', 'Steepener'] as const).map((m) => (
          <Pill
            key={m}
            label={m}
            active={mode === m.toLowerCase()}
            onClick={() => onModeChange(m.toLowerCase() as typeof mode)}
          />
        ))}
      </div>

      {mode === 'parallel' && (
        <>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '40px',
              fontWeight: 300,
              lineHeight: 1,
              margin: '8px 0 12px',
              letterSpacing: '-0.02em',
              color: shockColor,
            }}
          >
            {parallelBps >= 0 ? '+' : ''}
            {parallelBps} <span style={{ fontSize: '18px', color: 'var(--color-faint)' }}>bps</span>
          </div>
          <input
            type="range"
            min={-300}
            max={300}
            step={25}
            value={parallelBps}
            onChange={(e) => onParallelBpsChange(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--color-faint)',
              marginTop: '2px',
            }}
          >
            <span>–300</span>
            <span>0</span>
            <span>+300</span>
          </div>
        </>
      )}

      {mode === 'twist' && (
        <>
          <TwistRow
            label="Short end (≤2Y)"
            value={shortBps}
            onChange={onShortBpsChange}
          />
          <TwistRow
            label="Long end (≥10Y)"
            value={longBps}
            onChange={onLongBpsChange}
          />
        </>
      )}

      {mode === 'steepener' && (
        <TwistRow
          label="Long end shift (≥10Y)"
          value={longBps}
          onChange={onLongBpsChange}
        />
      )}
    </div>
  );
}

function TwistRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-faint)',
            minWidth: '120px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 500,
            minWidth: '50px',
            textAlign: 'right',
            color: value > 0 ? 'var(--color-red)' : value < 0 ? 'var(--color-green)' : 'var(--color-faint)',
          }}
        >
          {value >= 0 ? '+' : ''}{value} bps
        </span>
      </div>
      <input
        type="range"
        min={-300}
        max={300}
        step={25}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-faint)',
  marginBottom: '12px',
};

const sepStyle: React.CSSProperties = {
  height: '1px',
  background: 'rgba(255,255,255,0.06)',
  margin: '4px 0 16px',
};
