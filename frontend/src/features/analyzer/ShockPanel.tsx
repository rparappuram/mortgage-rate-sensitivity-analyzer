import clsx from 'clsx'
import { Card } from '../../components/ui/Card'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Slider } from '../../components/ui/Slider'
import { formatSignedBps } from '../../lib/format'
import { help } from './copy'
import { LIMITS, type AnalyzerInputs } from './state'

interface ShockPanelProps {
  inputs: AnalyzerInputs
  update: (patch: Partial<AnalyzerInputs>) => void
}

const modeOptions = [
  { value: 'parallel', label: 'Parallel' },
  { value: 'twist', label: 'Twist' },
  { value: 'steepener', label: 'Steepener' },
] as const

const presets = [-200, -100, -50, 0, 50, 100, 200]

export function ShockPanel({ inputs, update }: ShockPanelProps) {
  const sliderProps = { min: LIMITS.shockBps.min, max: LIMITS.shockBps.max, step: 5, decimals: 0, suffix: 'bps', format: (value: number) => formatSignedBps(value) }
  return (
    <Card
      title="Rate shock"
      subtitle="Move the curve and watch the value respond"
      actions={
        (inputs.parallelBps !== 0 || inputs.shortBps !== 0 || inputs.longBps !== 0) && (
          <button
            type="button"
            onClick={() => update({ parallelBps: 0, shortBps: 0, longBps: 0 })}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint transition hover:text-accent"
          >
            Clear
          </button>
        )
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Shape</div>
          <SegmentedControl ariaLabel="Shock shape" options={modeOptions} value={inputs.shockMode} onChange={(value) => update({ shockMode: value })} />
          <p className="text-[11px] leading-relaxed text-faint">{help.shockMode}</p>
        </div>
        {inputs.shockMode === 'parallel' && (
          <>
            <Slider label="Rate shift" value={inputs.parallelBps} onChange={(value) => update({ parallelBps: value })} {...sliderProps} />
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => update({ parallelBps: preset })}
                  className={clsx(
                    'rounded-md border px-2 py-1 font-mono text-[10px] tabular-nums transition',
                    inputs.parallelBps === preset ? 'border-accent bg-accent-soft text-accent' : 'border-line text-faint hover:border-line-strong hover:text-text',
                  )}
                >
                  {preset === 0 ? 'Base' : formatSignedBps(preset)}
                </button>
              ))}
            </div>
          </>
        )}
        {inputs.shockMode === 'twist' && (
          <>
            <Slider label="Short end (≤ 2 yrs)" value={inputs.shortBps} onChange={(value) => update({ shortBps: value })} {...sliderProps} />
            <Slider label="Long end (≥ 10 yrs)" value={inputs.longBps} onChange={(value) => update({ longBps: value })} {...sliderProps} />
          </>
        )}
        {inputs.shockMode === 'steepener' && (
          <>
            <Slider label="Long end (≥ 10 yrs)" value={inputs.longBps} onChange={(value) => update({ longBps: value })} {...sliderProps} />
            <p className="text-[11px] text-faint">Short end stays anchored at 0 bps; tenors between 2 and 10 years scale in proportionally.</p>
          </>
        )}
      </div>
    </Card>
  )
}
