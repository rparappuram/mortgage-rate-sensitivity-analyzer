import { useMarket } from './api/queries'
import { toError } from './lib/format'
import { Footer } from './components/layout/Footer'
import { NavBar } from './components/layout/NavBar'
import { AnalyzerSection } from './features/analyzer/AnalyzerSection'
import { MarketHero } from './features/market/MarketHero'
import { Methodology } from './features/methodology/Methodology'

export function App() {
  const market = useMarket()
  const status = market.data ? 'live' : market.isLoading ? 'loading' : 'offline'

  return (
    <div id="top" className="min-h-screen bg-bg text-text">
      <NavBar treasuryAsOf={market.data?.treasury.as_of ?? null} status={status} />
      <main>
        <MarketHero market={market.data} isLoading={market.isLoading} error={toError(market.error)} onRetry={() => void market.refetch()} />
        <AnalyzerSection />
        <Methodology />
      </main>
      <Footer />
    </div>
  )
}
