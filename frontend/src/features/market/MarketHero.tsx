import type { MarketResponse } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { Callout } from '../../components/ui/Callout'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatDate } from '../../lib/format'
import { RateHistoryChart } from './RateHistoryChart'
import { RateTiles, RateTilesSkeleton } from './RateTiles'
import { YieldCurveChart } from './YieldCurveChart'

interface MarketHeroProps {
  market: MarketResponse | undefined
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

export function MarketHero({ market, isLoading, error, onRetry }: MarketHeroProps) {
  return (
    <header id="rates" className="scroll-mt-20 pt-28 md:pt-36">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          <span className="h-px w-6 bg-faint" />
          Mortgage Rate Sensitivity Analyzer
        </div>
        <h1 className="mt-5 max-w-3xl font-serif text-[40px] leading-[1.05] text-text md:text-[64px]">
          The rate environment.
          <br />
          <em className="italic text-muted">Your mortgage. What changes.</em>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
          Today's Treasury yield curve and mortgage rates, and what they mean for any fixed-rate mortgage: the
          payment, what the loan is worth, how sensitive that value is to rates, and whether refinancing pays. Free,
          no sign-up, nothing stored.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#analyzer"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition hover:brightness-110"
          >
            Analyze a mortgage
          </a>
          <a
            href="#methodology"
            className="inline-flex items-center rounded-lg border border-line-strong px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition hover:border-accent hover:text-text"
          >
            How it works
          </a>
        </div>

        <div className="mt-12 space-y-4">
          {error && (
            <Callout tone="error" title="Live market data is unavailable right now" action={<Button onClick={onRetry}>Retry</Button>}>
              {error.message}
            </Callout>
          )}
          {isLoading && !market && <RateTilesSkeleton />}
          {market && <RateTiles market={market} />}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title="Treasury yield curve"
              subtitle={market ? `Par yields as of ${formatDate(market.treasury.as_of)}, with bootstrapped zero and forward rates` : 'Par, zero, and forward rates by tenor'}
            >
              {market ? <YieldCurveChart tenors={market.treasury.tenors} /> : <Skeleton className="h-[260px] w-full" />}
            </Card>
            <Card
              title="Past 52 weeks"
              subtitle="Weekly 30-year mortgage rate (Freddie Mac) against the 10-year Treasury yield"
            >
              {market ? (
                market.history.length > 0 ? (
                  <RateHistoryChart history={market.history} />
                ) : (
                  <div className="flex h-[260px] items-center justify-center text-xs text-faint">History unavailable</div>
                )
              ) : (
                <Skeleton className="h-[260px] w-full" />
              )}
            </Card>
          </div>
        </div>
      </div>
    </header>
  )
}
