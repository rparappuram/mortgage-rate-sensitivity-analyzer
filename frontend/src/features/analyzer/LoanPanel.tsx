import { Card } from '../../components/ui/Card'
import { DateField } from '../../components/ui/DateField'
import { NumberField } from '../../components/ui/NumberField'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Slider } from '../../components/ui/Slider'
import { formatNumber, toIsoDate } from '../../lib/format'
import { help } from './copy'
import { LIMITS, TERM_OPTIONS, type AnalyzerInputs } from './state'

interface LoanPanelProps {
  inputs: AnalyzerInputs
  update: (patch: Partial<AnalyzerInputs>) => void
}

const termOptions = TERM_OPTIONS.map((option) => ({ value: option.months, label: option.label }))

export function LoanPanel({ inputs, update }: LoanPanelProps) {
  const today = toIsoDate(new Date())
  return (
    <Card title="Loan" subtitle="Describe the mortgage as written in the note">
      <div className="space-y-5">
        <NumberField
          label="Original balance"
          info={help.originalBalance}
          value={inputs.originalBalance}
          min={LIMITS.balance.min}
          max={LIMITS.balance.max}
          prefix="$"
          format={(value) => formatNumber(value, 0)}
          onChange={(value) => value !== null && update({ originalBalance: value })}
        />
        <Slider
          label="Note rate"
          info={help.noteRate}
          value={inputs.noteRatePct}
          min={LIMITS.ratePct.min}
          max={LIMITS.ratePct.max}
          step={0.05}
          decimals={3}
          suffix="%"
          format={(value) => value.toFixed(2)}
          onChange={(value) => update({ noteRatePct: value })}
        />
        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Term</div>
          <SegmentedControl ariaLabel="Loan term" options={termOptions} value={inputs.termMonths} onChange={(value) => update({ termMonths: value })} />
        </div>
        <DateField
          label="Origination date"
          info={help.origination}
          value={inputs.originationDate}
          max={today}
          onChange={(value) => value && update({ originationDate: value })}
        />
        <NumberField
          label="Current balance"
          info={help.currentBalance}
          value={inputs.currentBalance}
          min={1}
          max={inputs.originalBalance}
          prefix="$"
          placeholder="Scheduled balance"
          allowEmpty
          format={(value) => formatNumber(value, 0)}
          onChange={(value) => update({ currentBalance: value })}
        />
      </div>
    </Card>
  )
}
