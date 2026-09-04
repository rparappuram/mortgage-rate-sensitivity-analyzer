from dataclasses import dataclass

from app.finance.loan import level_payment


@dataclass(frozen=True)
class RefinanceResult:
    market_rate: float
    new_term_months: int
    current_payment: float
    new_payment: float
    monthly_savings: float
    closing_costs: float
    breakeven_months: float | None
    remaining_interest_current: float
    remaining_interest_new: float
    lifetime_savings: float
    rate_advantage_bps: float


def evaluate_refinance(
    balance: float,
    note_rate: float,
    months_remaining: int,
    current_payment: float,
    market_rate: float,
    new_term_months: int,
    closing_costs_pct: float,
) -> RefinanceResult:
    new_payment = level_payment(balance, market_rate, new_term_months)
    monthly_savings = current_payment - new_payment
    closing_costs = balance * closing_costs_pct
    remaining_interest_current = max(current_payment * months_remaining - balance, 0.0)
    remaining_interest_new = max(new_payment * new_term_months - balance, 0.0)
    return RefinanceResult(
        market_rate=market_rate,
        new_term_months=new_term_months,
        current_payment=current_payment,
        new_payment=new_payment,
        monthly_savings=monthly_savings,
        closing_costs=closing_costs,
        breakeven_months=closing_costs / monthly_savings if monthly_savings > 0 else None,
        remaining_interest_current=remaining_interest_current,
        remaining_interest_new=remaining_interest_new,
        lifetime_savings=remaining_interest_current - remaining_interest_new - closing_costs,
        rate_advantage_bps=(note_rate - market_rate) * 10_000.0,
    )
