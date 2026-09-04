import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'subtle'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:brightness-110',
  ghost: 'border border-line-strong text-muted hover:border-accent hover:text-text',
  subtle: 'text-faint hover:text-text',
}

export function Button({ variant = 'ghost', className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
