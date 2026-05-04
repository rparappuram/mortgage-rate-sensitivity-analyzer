import type { ScenarioRow } from '../../types/api';

interface ScenarioTableProps {
  scenarios: ScenarioRow[];
  basePrice: number;
}

export function ScenarioTable({ scenarios }: ScenarioTableProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
        padding: '16px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--color-faint)',
          marginBottom: '12px',
        }}
      >
        Parallel Shift Scenario Table
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Shock', 'New Price', 'P&L $', 'P&L %'].map((h, i) => (
              <th
                key={h}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-faint)',
                  padding: '5px 8px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  textAlign: i === 0 ? 'left' : 'right',
                  fontWeight: 400,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenarios.map((row) => {
            const isBase = row.shock_bps === 0;
            const pnlColor =
              row.pnl_dollars > 0
                ? 'var(--color-green)'
                : row.pnl_dollars < 0
                  ? 'var(--color-red)'
                  : 'var(--color-text)';
            return (
              <tr
                key={row.shock_bps}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <td
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    padding: '8px 8px',
                    textAlign: 'left',
                    color: isBase ? 'var(--color-accent)' : 'var(--color-muted)',
                    fontWeight: isBase ? 500 : 400,
                  }}
                >
                  {isBase
                    ? 'Base'
                    : `${row.shock_bps > 0 ? '+' : ''}${row.shock_bps} bps`}
                </td>
                <td style={tdRight(isBase ? 'var(--color-accent)' : 'var(--color-text)', isBase)}>
                  {row.new_price.toFixed(2)}
                </td>
                <td style={tdRight(isBase ? 'var(--color-accent)' : pnlColor, isBase)}>
                  {isBase
                    ? '—'
                    : `${row.pnl_dollars >= 0 ? '+' : ''}$${Math.round(row.pnl_dollars).toLocaleString()}`}
                </td>
                <td style={tdRight(isBase ? 'var(--color-accent)' : pnlColor, isBase)}>
                  {isBase
                    ? '—'
                    : `${row.pnl_pct >= 0 ? '+' : ''}${row.pnl_pct.toFixed(1)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function tdRight(color: string, bold: boolean): React.CSSProperties {
  return {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '8px 8px',
    textAlign: 'right',
    color,
    fontWeight: bold ? 500 : 400,
  };
}
