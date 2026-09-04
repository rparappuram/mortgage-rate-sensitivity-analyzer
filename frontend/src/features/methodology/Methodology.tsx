import { Section } from '../../components/layout/Section'

interface Topic {
  title: string
  body: string[]
}

const topics: Topic[] = [
  {
    title: 'Data',
    body: [
      'Treasury rates come from the U.S. Department of the Treasury’s daily par yield curve (constant-maturity rates from 1 month to 30 years). Mortgage rates come from Freddie Mac’s weekly Primary Mortgage Market Survey, the same 30-year and 15-year averages quoted in the news.',
      'Both feeds are public and need no API key. The server caches each response and refreshes it in the background, so the site stays up and fast even when the source is slow. Picking a past valuation date pulls the curve and survey rate that were current on that day.',
    ],
  },
  {
    title: 'From par yields to a zero curve',
    body: [
      'Treasury publishes par yields: the coupon a bond would carry to trade at exactly 100. Discounting a stream of monthly mortgage cash flows needs zero (spot) rates instead, one per maturity. Tenors of six months or less are treated as simple-interest zeros. Longer tenors are bootstrapped in order: each par bond is priced with the zero rates already found, and the one unknown rate at its maturity is solved so the bond prices at par. Rates between knots are interpolated linearly.',
      'Forward rates shown in the chart are the implied rates between consecutive tenors. Zero and forward rates are reported on the same semi-annual basis as the published par yields.',
    ],
  },
  {
    title: 'Loan cash flows and prepayment',
    body: [
      'The scheduled payment is the standard level payment for the original balance, note rate, and term. Seasoning is counted in whole months from origination to the valuation date, and the balance follows the amortization schedule unless you enter the real balance from a statement.',
      'Each projected month pays interest on the outstanding balance, the scheduled principal, and an expected prepayment. Prepayment speed is expressed as an annual CPR and converted to a monthly rate (SMM). The rate-driven model combines housing turnover, which ramps to 6% CPR over the first 30 months, with a refinance response that follows an S-curve in the gap between the note rate and the current 30-year mortgage rate: near zero when the loan is below market, about 22% extra at 100 bps in the money, leveling off around 45% when deeply in the money. Total CPR is capped at 70%.',
    ],
  },
  {
    title: 'Value, price, and yield',
    body: [
      'Present value is the sum of expected cash flows discounted on the zero curve plus a spread. By default the spread is today’s gap between the 30-year mortgage rate and the 10-year Treasury, which means a loan written at today’s rate is worth roughly par. Price is present value as a percentage of the balance; yield is the annualized monthly rate that reproduces the present value.',
    ],
  },
  {
    title: 'Duration, convexity, and DV01',
    body: [
      'Rather than closed-form formulas, all rate sensitivities are measured by repricing the loan under shifted curves. Effective duration uses 50 bps up and down, convexity uses the same pair of prices and is reported per 100 bps squared, and DV01 uses 1 bp up and down. Because the rate-driven prepayment model speeds up when rates fall, loans above the market rate show negative convexity: the value gains less in a rally than it loses in a sell-off.',
    ],
  },
  {
    title: 'Rate shocks',
    body: [
      'A parallel shock moves every point on the zero curve by the same amount. A twist assigns separate moves to the short end (2 years and under) and the long end (10 years and over) and blends linearly in between. A steepener holds the short end fixed and scales the long-end move across the intermediate tenors. In every case the 30-year mortgage rate moves with the 10-year point, which feeds back into the refinance incentive and therefore into prepayments. The scenario table repeats the whole calculation for each parallel shock from −200 to +300 bps.',
    ],
  },
  {
    title: 'Refinance check',
    body: [
      'The comparison replaces the current balance with a new loan at the survey 30-year rate and the chosen term, then compares payments, the months needed to recover closing costs, and total interest over each path. A lower payment and a longer term can still cost more in lifetime interest, so both are shown.',
    ],
  },
  {
    title: 'What this is not',
    body: [
      'This is a single-loan, expected-cash-flow model. It ignores credit losses, servicing costs, taxes, points, option-adjusted spread analysis, and the actual behavior of any one borrower. The spread over Treasuries is held constant across shocks. Treat the outputs as a well-built estimate of how a mortgage responds to rates, not as a quote, an appraisal, or advice.',
    ],
  },
]

export function Methodology() {
  return (
    <Section
      id="methodology"
      eyebrow="Methodology"
      title="How the numbers are made."
      description="Every figure on this page comes from the calculations described here, run on the server against public data. No proprietary models, no black boxes."
    >
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
        {topics.map((topic) => (
          <article key={topic.title} className="space-y-2.5">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">{topic.title}</h3>
            {topic.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="text-sm leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>
    </Section>
  )
}
