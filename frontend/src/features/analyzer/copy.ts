export const help = {
  originalBalance: 'The amount borrowed at closing. Used with the note rate and term to reconstruct the scheduled payment.',
  currentBalance:
    'Optional. Enter the balance from your latest statement if you have made extra payments. Left blank, the scheduled amortized balance as of the valuation date is used.',
  noteRate: 'The fixed interest rate on the loan, as written in the note.',
  term: 'The original amortization term.',
  origination: 'The first day of the loan. Seasoning is measured from this date to the valuation date.',
  prepayment:
    'How fast the remaining balance is expected to be paid off early. Rate-driven ties the speed to the gap between your note rate and today’s market rate, so it speeds up when rates fall. Constant CPR uses one fixed annual rate.',
  cpr: 'Constant Prepayment Rate: the share of the remaining balance expected to prepay each year, on top of scheduled principal.',
  valuationDate:
    'Pick a past date to value the loan against the Treasury curve and mortgage rate that were in effect then. Blank uses the latest close.',
  spread:
    'Extra yield over Treasuries used to discount the loan’s cash flows. Auto uses today’s gap between the 30-year mortgage rate and the 10-year Treasury, so a loan written at today’s rate is worth about par.',
  closingCosts: 'Estimated cost to refinance, as a share of the balance being refinanced.',
  newTerm: 'Term of the replacement loan used in the refinance comparison.',
  shockMode:
    'Parallel moves every point on the curve by the same amount. Twist sets the short end (2 yrs and under) and long end (10 yrs and over) separately, blending in between. Steepener pins the short end and moves the long end.',
  presentValue:
    'What the remaining cash flows are worth today, discounted on the Treasury zero curve plus the spread. This is roughly what an investor would pay for the loan.',
  price: 'Present value as a percentage of the outstanding balance. Above 100 means the loan pays more than the market currently demands; below 100, less.',
  yield: 'The annualized rate that discounts the expected cash flows back to the present value.',
  wal: 'Weighted average life: the average time until each dollar of principal is returned, including expected prepayments.',
  duration:
    'Effective duration: the approximate percentage change in value for a 1 percentage-point move in rates, measured by repricing the loan 50 bps up and down.',
  convexity:
    'How duration itself changes as rates move, per 100 bps squared. Negative convexity is the mortgage signature: when rates fall, prepayments speed up and cap the upside.',
  dv01: 'Dollar value of one basis point: how many dollars the loan’s value changes when rates move 0.01%.',
  averageCpr: 'Balance-weighted average annual prepayment rate implied by the prepayment model over the loan’s remaining life.',
  couponSpread: 'Your note rate minus the reference rate. Positive against the mortgage rate means you are paying more than a new borrower would today.',
  linearEstimate: 'What duration alone would predict for this shock. The gap between this and the actual result is the convexity effect.',
} as const
