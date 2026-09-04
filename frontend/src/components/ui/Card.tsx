import clsx from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Card({ title, subtitle, actions, children, className, bodyClassName }: CardProps) {
  return (
    <section className={clsx('rounded-2xl border border-line bg-surface shadow-card', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{title}</h3>}
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-faint">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={clsx('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}
