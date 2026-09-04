import { useState } from 'react'
import { useAnalysis } from '../../api/queries'
import { Section } from '../../components/layout/Section'
import { Button } from '../../components/ui/Button'
import { toError } from '../../lib/format'
import { AssumptionsPanel } from './AssumptionsPanel'
import { LoanPanel } from './LoanPanel'
import { ResultsPanel } from './results/ResultsPanel'
import { ShockPanel } from './ShockPanel'
import { useAnalyzerState } from './useAnalyzerState'

export function AnalyzerSection() {
  const { inputs, request, update, reset, isDirty } = useAnalyzerState()
  const analysis = useAnalysis(request)
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Section
      id="analyzer"
      eyebrow="Analyzer"
      title="Put a mortgage on the curve."
      description="Enter the loan, choose how it is expected to prepay, and every number below is recomputed from the live Treasury curve and mortgage rate. The link in your address bar always reproduces what you see."
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button onClick={copyLink}>{copied ? 'Link copied' : 'Copy link to this analysis'}</Button>
        {isDirty && (
          <Button variant="subtle" onClick={reset}>
            Reset to defaults
          </Button>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <LoanPanel inputs={inputs} update={update} />
          <ShockPanel inputs={inputs} update={update} />
          <AssumptionsPanel inputs={inputs} update={update} autoSpreadBps={analysis.data?.market.spread_bps ?? null} />
        </div>
        <div className="min-w-0">
          <ResultsPanel
            analysis={analysis.data}
            inputs={inputs}
            isFetching={analysis.isFetching}
            error={toError(analysis.error)}
            onRetry={() => void analysis.refetch()}
          />
        </div>
      </div>
    </Section>
  )
}
