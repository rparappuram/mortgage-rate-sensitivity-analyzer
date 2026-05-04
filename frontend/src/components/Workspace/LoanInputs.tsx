import { Pill } from '../shared/Pill';

interface LoanInputsProps {
  balance: number;
  onBalanceChange: (v: number) => void;
  noteRate: number;
  onNoteRateChange: (v: number) => void;
  termYears: 10 | 15 | 30;
  onTermChange: (v: 10 | 15 | 30) => void;
  originationDate: string;
  onOriginationDateChange: (v: string) => void;
  cpr: number;
  onCprChange: (v: number) => void;
  discountCurve: 'zero' | 'par';
  onDiscountCurveChange: (v: 'zero' | 'par') => void;
  asOfDate: string;
  onAsOfDateChange: (v: string) => void;
}

function fmt$(v: number): string {
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function LoanInputs({
  balance,
  onBalanceChange,
  noteRate,
  onNoteRateChange,
  termYears,
  onTermChange,
  originationDate,
  onOriginationDateChange,
  cpr,
  onCprChange,
  discountCurve,
  onDiscountCurveChange,
  asOfDate,
  onAsOfDateChange,
}: LoanInputsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={sectionTitleStyle}>Loan Parameters</div>

      <Field label="Original Balance" value={fmt$(balance)}>
        <input
          type="range"
          min={100_000}
          max={5_000_000}
          step={10_000}
          value={balance}
          onChange={(e) => onBalanceChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
      </Field>

      <Field label="Note Rate" value={`${(noteRate * 100).toFixed(2)}%`}>
        <input
          type="range"
          min={0.02}
          max={0.12}
          step={0.0025}
          value={noteRate}
          onChange={(e) => onNoteRateChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
      </Field>

      <div style={fieldStyle}>
        <div style={fkeyStyle}>Loan Term</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([30, 15, 10] as const).map((t) => (
            <Pill key={t} label={`${t}yr`} active={termYears === t} onClick={() => onTermChange(t)} />
          ))}
        </div>
      </div>

      <div style={fieldStyle}>
        <div style={fkeyStyle}>Origination Date</div>
        <input
          type="date"
          value={originationDate}
          onChange={(e) => onOriginationDateChange(e.target.value)}
          style={dateInputStyle}
        />
      </div>

      <Field label="CPR — Prepayment Speed" value={`${(cpr * 100).toFixed(0)}%`}>
        <input
          type="range"
          min={0}
          max={0.4}
          step={0.01}
          value={cpr}
          onChange={(e) => onCprChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
      </Field>

      <div style={fieldStyle}>
        <div style={fkeyStyle}>Discount Curve</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Pill
            label="Zero (bootstrapped)"
            active={discountCurve === 'zero'}
            onClick={() => onDiscountCurveChange('zero')}
          />
          <Pill
            label="Par"
            active={discountCurve === 'par'}
            onClick={() => onDiscountCurveChange('par')}
          />
        </div>
      </div>

      <div style={fieldStyle}>
        <div style={fkeyStyle}>As-of Date</div>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => onAsOfDateChange(e.target.value)}
          style={dateInputStyle}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div style={fieldStyle}>
      <div style={fkeyStyle}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}
        <span style={routStyle}>{value}</span>
      </div>
    </div>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-faint)',
  padding: '0 0 12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  marginBottom: '16px',
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '12px',
};

const fkeyStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--color-faint)',
  marginBottom: '5px',
};

const routStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text)',
  minWidth: '64px',
  textAlign: 'right',
};

const dateInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface2)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  padding: '5px 9px',
  outline: 'none',
};
