interface PillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function Pill({ label, active, onClick }: PillProps) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        padding: '3px 10px',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        border: `1px solid ${active ? 'var(--color-accent)' : 'rgba(255,255,255,0.12)'}`,
        background: active ? 'rgba(91,156,246,0.08)' : 'var(--color-surface2)',
        color: active ? 'var(--color-accent)' : 'var(--color-faint)',
        fontWeight: active ? '500' : '400',
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </button>
  );
}
