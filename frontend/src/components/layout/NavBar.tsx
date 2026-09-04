import clsx from 'clsx'
import { formatDate } from '../../lib/format'

interface NavBarProps {
  treasuryAsOf: string | null
  status: 'loading' | 'live' | 'offline'
}

const links = [
  { href: '#rates', label: 'Rates' },
  { href: '#analyzer', label: 'Analyzer' },
  { href: '#methodology', label: 'Methodology' },
]

export function NavBar({ treasuryAsOf, status }: NavBarProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-5 md:px-8">
        <a href="#top" className="font-mono text-sm font-medium tracking-[0.18em] text-text">
          MRS<span className="text-accent">A</span>
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-xs text-muted transition hover:text-text">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
          <span
            className={clsx(
              'inline-block h-1.5 w-1.5 rounded-full',
              status === 'live' && 'bg-positive',
              status === 'loading' && 'bg-warning animate-pulse',
              status === 'offline' && 'bg-negative',
            )}
          />
          {status === 'live' && treasuryAsOf ? `Treasury · ${formatDate(treasuryAsOf)}` : status === 'loading' ? 'Loading' : 'Offline'}
        </div>
      </div>
    </nav>
  )
}
