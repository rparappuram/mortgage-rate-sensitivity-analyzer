import type { ReactNode } from 'react'

interface SectionProps {
  id: string
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}

export function Section({ id, eyebrow, title, description, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-20 py-14 md:py-20">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="mb-8 max-w-2xl">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            <span className="h-px w-6 bg-faint" />
            {eyebrow}
          </div>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-text md:text-4xl">{title}</h2>
          {description && <p className="mt-3 text-sm leading-relaxed text-muted md:text-[15px]">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}
