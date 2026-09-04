from app.data.errors import MarketDataUnavailableError
from app.finance.curve import continuous_to_semiannual
from app.finance.loan import (
    LoanTerms,
    add_months,
    level_payment,
    months_elapsed,
    scheduled_balance,
)
from app.finance.prepayment import ConstantPrepayment, PrepaymentModel, RefinanceIncentivePrepayment
from app.finance.refinance import evaluate_refinance
from app.finance.shocks import BASIS_POINT, RateShock
from app.finance.valuation import (
    ValuationContext,
    ValuationPoint,
    price_curve,
    risk_measures,
    scenario_table,
    solve_annual_yield,
    value_under_shock,
)
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    AnnualCashflow,
    CurveNode,
    LoanSummary,
    MarketContext,
    MonthlyCashflow,
    PriceCurvePoint,
    RefinanceSummary,
    ScenarioRow,
    ShockSummary,
    ValuationSummary,
)
from app.services.market import MarketSnapshot, build_zero_curve

PERCENT = 100.0
DEFAULT_MORTGAGE_SPREAD_BPS = 170.0
CONVEXITY_SCALE = 100.0
MONTHS_PER_YEAR = 12


class AnalysisError(ValueError):
    pass


def run_analysis(request: AnalysisRequest, snapshot: MarketSnapshot) -> AnalysisResponse:
    treasury = snapshot.treasury
    as_of = treasury.observed_on
    treasury_10y_pct = treasury.rate("10Y")
    if treasury_10y_pct is None:
        raise MarketDataUnavailableError(f"Treasury observation on {as_of} has no 10-year rate")

    if snapshot.mortgage is not None:
        mortgage_rate_pct = snapshot.mortgage.rate_30y_pct
        mortgage_source = "freddie_mac"
        mortgage_as_of = snapshot.mortgage.observed_on
    else:
        mortgage_rate_pct = treasury_10y_pct + DEFAULT_MORTGAGE_SPREAD_BPS / PERCENT
        mortgage_source = "estimated"
        mortgage_as_of = None

    spread_bps = (
        request.valuation.spread_bps
        if request.valuation.spread_bps is not None
        else (mortgage_rate_pct - treasury_10y_pct) * PERCENT
    )

    loan = request.loan
    terms = LoanTerms(
        loan.original_balance, loan.note_rate_pct / PERCENT, loan.term_months, loan.origination_date
    )
    if loan.origination_date > as_of:
        raise AnalysisError("The origination date is after the valuation date")
    months_seasoned = min(months_elapsed(loan.origination_date, as_of), terms.term_months)
    months_remaining = terms.term_months - months_seasoned
    if months_remaining <= 0:
        raise AnalysisError("The loan has fully matured as of the valuation date")

    prepayment = build_prepayment_model(request)
    amortized_balance = scheduled_balance(terms, months_seasoned)
    if loan.current_balance is not None:
        balance, balance_source = loan.current_balance, "provided"
    else:
        balance, balance_source = amortized_balance, "scheduled"
    if balance <= 0:
        raise AnalysisError("The loan balance is already paid off as of the valuation date")

    context = ValuationContext(
        terms=terms,
        balance=balance,
        loan_age_months=months_seasoned,
        months_remaining=months_remaining,
        first_period_date=add_months(loan.origination_date, months_seasoned + 1),
        curve=build_zero_curve(treasury),
        spread=spread_bps * BASIS_POINT,
        prepayment=prepayment,
        market_mortgage_rate=mortgage_rate_pct / PERCENT,
        treasury_10y_rate=treasury_10y_pct / PERCENT,
    )
    base = value_under_shock(context, RateShock.parallel(0.0))
    risk = risk_measures(context, base)
    user_shock = RateShock(
        mode=request.shock.mode,
        parallel_bps=request.shock.parallel_bps,
        short_bps=request.shock.short_bps,
        long_bps=request.shock.long_bps,
    )
    shocked = base if user_shock.is_zero else value_under_shock(context, user_shock)
    refinance = evaluate_refinance(
        balance=balance,
        note_rate=terms.note_rate,
        months_remaining=months_remaining,
        current_payment=terms.scheduled_payment,
        market_rate=mortgage_rate_pct / PERCENT,
        new_term_months=request.refinance.new_term_months,
        closing_costs_pct=request.refinance.closing_costs_pct / PERCENT,
    )

    return AnalysisResponse(
        market=MarketContext(
            as_of=as_of,
            treasury_10y=treasury_10y_pct,
            mortgage_rate_30y=mortgage_rate_pct,
            mortgage_rate_as_of=mortgage_as_of,
            mortgage_rate_source=mortgage_source,
            spread_bps=round(spread_bps, 1),
        ),
        loan=LoanSummary(
            monthly_payment=round(terms.scheduled_payment, 2),
            months_seasoned=months_seasoned,
            months_remaining=months_remaining,
            current_balance=round(balance, 2),
            scheduled_balance=round(amortized_balance, 2),
            balance_source=balance_source,
            maturity_date=terms.maturity_date,
            remaining_scheduled_interest=round(
                max(terms.scheduled_payment * months_remaining - balance, 0.0), 2
            ),
        ),
        valuation=ValuationSummary(
            present_value=round(base.present_value, 2),
            price=round(base.price, 4),
            yield_pct=round(solve_annual_yield(base.cashflows, base.present_value) * PERCENT, 4),
            wal_years=round(base.wal_years, 3),
            effective_duration=round(risk.effective_duration, 4),
            convexity=round(risk.convexity / CONVEXITY_SCALE, 4),
            dv01=round(risk.dv01, 2),
            average_cpr_pct=round(base.average_cpr * PERCENT, 2),
            coupon_spread_vs_10y_bps=round((loan.note_rate_pct - treasury_10y_pct) * PERCENT, 1),
            coupon_spread_vs_mortgage_bps=round((loan.note_rate_pct - mortgage_rate_pct) * PERCENT, 1),
        ),
        shock=shock_summary(user_shock, base, shocked, risk.effective_duration),
        curve=curve_nodes(context, user_shock, treasury.par_rates_pct),
        scenarios=[
            ScenarioRow(
                shock_bps=point.shock_bps,
                treasury_10y=round(point.treasury_10y_rate * PERCENT, 4),
                mortgage_rate_30y=round(point.mortgage_rate * PERCENT, 4),
                average_cpr_pct=round(point.average_cpr * PERCENT, 2),
                price=round(point.price, 4),
                present_value=round(point.present_value, 2),
                pnl=round(point.pnl, 2),
                pnl_pct=round(point.pnl_pct, 4),
                wal_years=round(point.wal_years, 3),
                new_loan_payment=round(level_payment(balance, point.mortgage_rate, terms.term_months), 2),
            )
            for point in scenario_table(context, base)
        ],
        price_curve=[
            PriceCurvePoint(shock_bps=bps, price=round(price, 4)) for bps, price in price_curve(context)
        ],
        annual_cashflows=annual_cashflows(base),
        monthly_cashflows=[
            MonthlyCashflow(
                month=row.month,
                period_date=row.period_date,
                starting_balance=round(row.starting_balance, 2),
                payment=round(row.total, 2),
                interest=round(row.interest, 2),
                scheduled_principal=round(row.scheduled_principal, 2),
                prepayment=round(row.prepayment, 2),
                ending_balance=round(row.ending_balance, 2),
                annual_cpr_pct=round(row.annual_cpr * PERCENT, 2),
            )
            for row in base.cashflows
        ],
        refinance=RefinanceSummary(
            market_rate=round(refinance.market_rate * PERCENT, 4),
            rate_advantage_bps=round(refinance.rate_advantage_bps, 1),
            new_term_months=refinance.new_term_months,
            current_payment=round(refinance.current_payment, 2),
            new_payment=round(refinance.new_payment, 2),
            monthly_savings=round(refinance.monthly_savings, 2),
            closing_costs=round(refinance.closing_costs, 2),
            breakeven_months=round(refinance.breakeven_months, 1) if refinance.breakeven_months else None,
            remaining_interest_current=round(refinance.remaining_interest_current, 2),
            remaining_interest_new=round(refinance.remaining_interest_new, 2),
            lifetime_savings=round(refinance.lifetime_savings, 2),
        ),
    )


def build_prepayment_model(request: AnalysisRequest) -> PrepaymentModel:
    if request.prepayment.model == "constant":
        return ConstantPrepayment(request.prepayment.cpr_pct / PERCENT)
    return RefinanceIncentivePrepayment()


def shock_summary(
    shock: RateShock, base: ValuationPoint, shocked: ValuationPoint, duration: float
) -> ShockSummary:
    pnl = shocked.present_value - base.present_value
    return ShockSummary(
        mode=shock.mode,
        parallel_bps=shock.parallel_bps,
        short_bps=shock.short_bps,
        long_bps=shock.long_bps,
        mortgage_rate_shift_bps=round(shock.mortgage_rate_shift() / BASIS_POINT, 1),
        present_value=round(shocked.present_value, 2),
        price=round(shocked.price, 4),
        price_change=round(shocked.price - base.price, 4),
        pnl=round(pnl, 2),
        pnl_pct=round(pnl / base.present_value * PERCENT, 4) if base.present_value else 0.0,
        linear_estimate_pnl=round(-duration * base.present_value * shock.mortgage_rate_shift(), 2),
        wal_years=round(shocked.wal_years, 3),
        average_cpr_pct=round(shocked.average_cpr * PERCENT, 2),
        mortgage_rate_30y=round(shocked.mortgage_rate * PERCENT, 4),
    )


def curve_nodes(
    context: ValuationContext, shock: RateShock, par_rates_pct: dict[str, float]
) -> list[CurveNode]:
    base_curve = context.curve
    shocked_curve = base_curve.shifted(shock.shift)
    base_zero = continuous_to_semiannual(base_curve.zero_rates) * PERCENT
    shocked_zero = continuous_to_semiannual(shocked_curve.zero_rates) * PERCENT
    return [
        CurveNode(
            tenor=label,
            years=round(float(base_curve.years[index]), 4),
            base_zero_rate=round(float(base_zero[index]), 4),
            shocked_zero_rate=round(float(shocked_zero[index]), 4),
            base_par_rate=par_rates_pct[label],
        )
        for index, label in enumerate(base_curve.labels)
    ]


def annual_cashflows(base: ValuationPoint) -> list[AnnualCashflow]:
    buckets: dict[int, AnnualCashflow] = {}
    for row in base.cashflows:
        year = (row.month - 1) // MONTHS_PER_YEAR + 1
        bucket = buckets.get(year)
        if bucket is None:
            buckets[year] = AnnualCashflow(
                year=year,
                period_start=row.period_date,
                interest=row.interest,
                scheduled_principal=row.scheduled_principal,
                prepayment=row.prepayment,
                ending_balance=row.ending_balance,
            )
        else:
            buckets[year] = bucket.model_copy(
                update={
                    "interest": bucket.interest + row.interest,
                    "scheduled_principal": bucket.scheduled_principal + row.scheduled_principal,
                    "prepayment": bucket.prepayment + row.prepayment,
                    "ending_balance": row.ending_balance,
                }
            )
    return [
        bucket.model_copy(
            update={
                "interest": round(bucket.interest, 2),
                "scheduled_principal": round(bucket.scheduled_principal, 2),
                "prepayment": round(bucket.prepayment, 2),
                "ending_balance": round(bucket.ending_balance, 2),
            }
        )
        for bucket in buckets.values()
    ]
