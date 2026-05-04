import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { CurveChart } from './components/Hero/CurveChart';
import { RateCards } from './components/Hero/RateCards';
import { ConvexityChart } from './components/Workspace/ConvexityChart';
import { LoanInputs } from './components/Workspace/LoanInputs';
import { PositionMetrics } from './components/Workspace/PositionMetrics';
import { ScenarioTable } from './components/Workspace/ScenarioTable';
import { ShockControls } from './components/Workspace/ShockControls';
import { ShockCurveChart } from './components/Workspace/ShockCurveChart';
import { ShockImpact } from './components/Workspace/ShockImpact';
import { WaterfallChart } from './components/Workspace/WaterfallChart';
import { usePosition } from './hooks/usePosition';
import { useRates } from './hooks/useRates';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { data: ratesData, isLoading: ratesLoading, error: ratesError } = useRates();

  const [balance, setBalance] = useState(500_000);
  const [noteRate, setNoteRate] = useState(0.0725);
  const [termYears, setTermYears] = useState<10 | 15 | 30>(30);
  const [originationDate, setOriginationDate] = useState('2022-06-01');
  const [cpr, setCpr] = useState(0.08);
  const [discountCurve, setDiscountCurve] = useState<'zero' | 'par'>('zero');
  const [asOfDate, setAsOfDate] = useState('');

  const [shockMode, setShockMode] = useState<'parallel' | 'twist' | 'steepener'>('parallel');
  const [parallelBps, setParallelBps] = useState(0);
  const [shortBps, setShortBps] = useState(0);
  const [longBps, setLongBps] = useState(0);

  const { data: position, isLoading: posLoading } = usePosition({
    original_balance: balance,
    note_rate: noteRate,
    loan_term_years: termYears,
    origination_date: originationDate,
    cpr,
    discount_curve: discountCurve,
    as_of_date: asOfDate || undefined,
    shock_mode: shockMode,
    shock_parallel_bps: parallelBps,
    shock_short_bps: shortBps,
    shock_long_bps: longBps,
  });

  return (
    <div>
      {/* NAV */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '14px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid transparent',
          transition: 'background 0.3s',
          background: 'rgba(9,9,11,0.9)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.12em',
          }}
        >
          MRS<span style={{ color: 'var(--color-accent)' }}>A</span>
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-faint)',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'var(--color-green)',
              animation: 'none',
              opacity: ratesData ? 1 : 0.3,
            }}
          />
          {ratesData ? `US Treasury · Live` : ratesLoading ? 'Loading…' : 'Offline'}
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '100px 40px 60px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              color: 'var(--color-faint)',
              textTransform: 'uppercase',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ width: '20px', height: '1px', background: 'var(--color-faint)', display: 'inline-block' }} />
            Mortgage Rate Sensitivity Analyzer
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 400,
              lineHeight: 1.1,
              marginBottom: '20px',
            }}
          >
            The rate environment.
            <br />
            <em
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                color: 'var(--color-muted)',
              }}
            >
              Your position. What changes.
            </em>
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: 'var(--color-muted)',
              maxWidth: '480px',
              lineHeight: 1.7,
              fontWeight: 300,
              marginBottom: '48px',
            }}
          >
            Live Treasury yield curve, bootstrapped zero rates, and real-time shock analysis for
            residential mortgage debt.
          </p>

          {ratesLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-faint)',
                marginBottom: '32px',
              }}
            >
              <Spinner />
              Fetching live Treasury data…
            </div>
          )}

          {ratesError && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-red)',
                marginBottom: '32px',
                padding: '12px 16px',
                background: 'var(--color-red-dim)',
                border: '1px solid rgba(240,96,96,0.2)',
                borderRadius: '8px',
              }}
            >
              Unable to fetch live rates. Make sure the backend is running on port 8000.
            </div>
          )}

          {ratesData && (
            <>
              <RateCards data={ratesData} />
              <CurveChart data={ratesData} />
            </>
          )}

          <div
            style={{
              marginTop: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px',
              opacity: 0.5,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-faint)',
                letterSpacing: '0.08em',
              }}
            >
              Scroll to analyze
            </span>
            <div
              style={{
                width: '1px',
                height: '36px',
                background: 'linear-gradient(to bottom, var(--color-faint), transparent)',
              }}
            />
          </div>
        </div>
      </section>

      {/* WORKSPACE */}
      <div
        id="workspace"
        style={{
          display: 'flex',
          gap: '0',
          minHeight: '100vh',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* LEFT PANEL */}
        <div
          style={{
            width: '240px',
            minWidth: '240px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: '24px 20px',
            position: 'sticky',
            top: '53px',
            height: 'calc(100vh - 53px)',
            overflowY: 'auto',
          }}
        >
          <LoanInputs
            balance={balance}
            onBalanceChange={setBalance}
            noteRate={noteRate}
            onNoteRateChange={setNoteRate}
            termYears={termYears}
            onTermChange={setTermYears}
            originationDate={originationDate}
            onOriginationDateChange={setOriginationDate}
            cpr={cpr}
            onCprChange={setCpr}
            discountCurve={discountCurve}
            onDiscountCurveChange={setDiscountCurve}
            asOfDate={asOfDate}
            onAsOfDateChange={setAsOfDate}
          />
          <ShockControls
            mode={shockMode}
            onModeChange={setShockMode}
            parallelBps={parallelBps}
            onParallelBpsChange={setParallelBps}
            shortBps={shortBps}
            onShortBpsChange={setShortBps}
            longBps={longBps}
            onLongBpsChange={setLongBps}
          />

          <div
            style={{
              marginTop: 'auto',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--color-faint)',
              lineHeight: 1.9,
            }}
          >
            CPR = Constant Prepayment Rate
            <br />
            WAL = Weighted Average Life
            <br />
            DV01 = $ change per 1 basis point
            <br />
            Zero curve via sequential bootstrapping
            <br />
            Data: US Department of the Treasury
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, padding: '24px', overflowX: 'auto' }}>
          {posLoading && !position && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-faint)',
              }}
            >
              <Spinner />
              Computing position…
            </div>
          )}

          {position && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* TOP ROW: metrics + impact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <PositionMetrics data={position} />
                <ShockImpact data={position} basePrice={position.price} />
              </div>

              {/* CHARTS ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <ShockCurveChart
                  tenors={position.shocked_curve_tenors}
                  hasShock={parallelBps !== 0 || shortBps !== 0 || longBps !== 0}
                />
                <WaterfallChart cashflows={position.cashflows} />
                <ConvexityChart
                  data={position.price_yield_curve}
                  currentShockBps={shockMode === 'parallel' ? parallelBps : 0}
                />
              </div>

              {/* SCENARIO TABLE */}
              <ScenarioTable scenarios={position.scenarios} basePrice={position.price} />
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer
        style={{
          padding: '40px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-faint)',
          lineHeight: 1.8,
        }}
      >
        MRSA · <em style={{ color: 'var(--color-accent)', fontStyle: 'normal' }}>mrsa.app</em> ·
        Data: US Department of the Treasury · No API key required
      </footer>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: '12px',
        height: '12px',
        border: '1.5px solid rgba(255,255,255,0.12)',
        borderTopColor: 'var(--color-accent)',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
