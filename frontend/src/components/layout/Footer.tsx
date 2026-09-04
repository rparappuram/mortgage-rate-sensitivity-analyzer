const REPOSITORY_URL = 'https://github.com/rparappuram/mortgage-rate-sensitivity-analyzer'
const AUTHOR_URL = 'https://www.linkedin.com/in/ryanparappuram'

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-2 text-xs leading-relaxed text-faint">
            <p>
              <span className="font-mono text-text">MRSA</span> is an educational tool. Nothing here is investment,
              lending, or tax advice, and every figure is a model output driven by the assumptions you set. Confirm
              numbers with your lender or advisor before acting on them.
            </p>
            <p>
              Data: U.S. Department of the Treasury daily par yield curve and Freddie Mac Primary Mortgage Market
              Survey. Both feeds are public and used without modification beyond the calculations described in the
              methodology.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-faint md:items-end">
            <a href={REPOSITORY_URL} className="transition hover:text-accent" target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
            <a href={AUTHOR_URL} className="transition hover:text-accent" target="_blank" rel="noreferrer">
              Built by Ryan Parappuram
            </a>
            <span>mrsa.app</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
