import { Card } from '../../components/ui/Card'
import { DateField } from '../../components/ui/DateField'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Slider } from '../../components/ui/Slider'
import { toIsoDate } from '../../lib/format'
import { help } from './copy'
import { LIMITS, type AnalyzerInputs } from './state'

interface AssumptionsPanelProps {
  inputs: AnalyzerInputs
  update: (patch: Partial<AnalyzerInputs>) => void
  autoSpreadBps: number | null
}

const prepaymentOptions = [
  { value: 'refinance_incentive', label: 'Rate-driven' },
  { value: 'constant', label: 'Constant CPR' },
] as const

const newTermOptions = [
  { value: 360, label: '30 yr' },
  { value: 240, label: '20 yr' },
  { value: 180, label: '15 yr' },
] as const

export function AssumptionsPanel({ inputs, update, autoSpreadBps }: AssumptionsPanelProps) {
  const today = toIsoDate(new Date())
  const spreadValue = inputs.spreadBps ?? autoSpreadBps ?? 170
  return (
    <Card title="Assumptions" subtitle="Prepayment, valuation date, discounting, and refinance costs">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Prepayment model</div>
          <SegmentedControl
            ariaLabel="Prepayment model"
            options={prepaymentOptions}
            value={inputs.prepaymentModel}
            onChange={(value) => update({ prepaymentModel: value })}
          />
          <p className="text-[11px] leading-relaxed text-faint">
            {inputs.prepaymentModel === 'refinance_incentive'
              ? 'Housing turnover ramps to 6% CPR over 30 months, plus a refinance response that rises as your rate exceeds the market rate.'
              : help.cpr}
          </p>
        </div>
        {inputs.prepaymentModel === 'constant' && (
          <Slider
            label="CPR"
            info={help.cpr}
            value={inputs.cprPct}
            min={LIMITS.cprPct.min}
            max={LIMITS.cprPct.max}
            step={0.5}
            decimals={1}
            suffix="%"
            format={(value) => value.toFixed(1)}
            onChange={(value) => update({ cprPct: value })}
          />
        )}
        <DateField
          label="Valuation date"
          info={help.valuationDate}
          value={inputs.asOf}
          max={today}
          min="1990-01-02"
          clearable
          placeholderLabel="Latest Treasury close"
          onChange={(value) => update({ asOf: value })}
        />
        <div className="space-y-1.5">
          <Slider
            label="Spread over Treasuries"
            info={help.spread}
            value={spreadValue}
            min={LIMITS.spreadBps.min}
            max={LIMITS.spreadBps.max}
            step={5}
            decimals={0}
            suffix="bps"
            format={(value) => value.toFixed(0)}
            onChange={(value) => update({ spreadBps: value })}
          />
          <div className="flex items-center justify-between text-[11px] text-faint">
            <span>{inputs.spreadBps === null ? 'Auto: 30-yr mortgage rate minus 10-yr Treasury' : 'Manual override'}</span>
            {inputs.spreadBps !== null && (
              <button type="button" onClick={() => update({ spreadBps: null })} className="font-mono uppercase tracking-[0.1em] transition hover:text-accent">
                Use auto
              </button>
            )}
          </div>
        </div>
        <Slider
          label="Refinance closing costs"
          info={help.closingCosts}
          value={inputs.closingCostsPct}
          min={LIMITS.closingCostsPct.min}
          max={LIMITS.closingCostsPct.max}
          step={0.25}
          decimals={2}
          suffix="%"
          format={(value) => value.toFixed(2)}
          onChange={(value) => update({ closingCostsPct: value })}
        />
        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Refinance term</div>
          <SegmentedControl ariaLabel="Refinance term" options={newTermOptions} value={inputs.newTermMonths} onChange={(value) => update({ newTermMonths: value })} />
        </div>
      </div>
    </Card>
  )
}
