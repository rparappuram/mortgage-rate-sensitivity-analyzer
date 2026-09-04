import calendar
from dataclasses import dataclass
from datetime import date

from app.finance.prepayment import MONTHS_PER_YEAR, PrepaymentModel, single_monthly_mortality

PAID_OFF_THRESHOLD = 0.005


@dataclass(frozen=True)
class LoanTerms:
    original_balance: float
    note_rate: float
    term_months: int
    origination_date: date

    @property
    def monthly_rate(self) -> float:
        return self.note_rate / MONTHS_PER_YEAR

    @property
    def scheduled_payment(self) -> float:
        return level_payment(self.original_balance, self.note_rate, self.term_months)

    @property
    def maturity_date(self) -> date:
        return add_months(self.origination_date, self.term_months)


@dataclass(frozen=True)
class CashflowRow:
    month: int
    period_date: date
    starting_balance: float
    interest: float
    scheduled_principal: float
    prepayment: float
    ending_balance: float
    annual_cpr: float

    @property
    def principal(self) -> float:
        return self.scheduled_principal + self.prepayment

    @property
    def total(self) -> float:
        return self.interest + self.principal


def level_payment(balance: float, annual_rate: float, months: int) -> float:
    monthly_rate = annual_rate / MONTHS_PER_YEAR
    if monthly_rate == 0:
        return balance / months
    growth = (1.0 + monthly_rate) ** months
    return balance * monthly_rate * growth / (growth - 1.0)


def add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year = start.year + month_index // MONTHS_PER_YEAR
    month = month_index % MONTHS_PER_YEAR + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def months_elapsed(start: date, end: date) -> int:
    elapsed = (end.year - start.year) * MONTHS_PER_YEAR + (end.month - start.month)
    if end.day < start.day:
        elapsed -= 1
    return max(0, elapsed)


def project_cashflows(
    terms: LoanTerms,
    starting_balance: float,
    loan_age_months: int,
    months_remaining: int,
    first_period_date: date,
    prepayment: PrepaymentModel,
    incentive_bps: float,
) -> list[CashflowRow]:
    payment = terms.scheduled_payment
    balance = starting_balance
    rows: list[CashflowRow] = []
    for month in range(1, months_remaining + 1):
        if balance <= PAID_OFF_THRESHOLD:
            break
        interest = balance * terms.monthly_rate
        scheduled_principal = min(max(payment - interest, 0.0), balance)
        annual_cpr = prepayment.annual_cpr(loan_age_months + month, incentive_bps)
        prepaid = (balance - scheduled_principal) * single_monthly_mortality(annual_cpr)
        ending_balance = balance - scheduled_principal - prepaid
        if ending_balance <= PAID_OFF_THRESHOLD:
            prepaid += ending_balance
            ending_balance = 0.0
        rows.append(
            CashflowRow(
                month=month,
                period_date=add_months(first_period_date, month - 1),
                starting_balance=balance,
                interest=interest,
                scheduled_principal=scheduled_principal,
                prepayment=prepaid,
                ending_balance=ending_balance,
                annual_cpr=annual_cpr,
            )
        )
        balance = ending_balance
    return rows


def scheduled_balance(terms: LoanTerms, months: int) -> float:
    if months >= terms.term_months:
        return 0.0
    growth = (1.0 + terms.monthly_rate) ** months
    if terms.monthly_rate == 0:
        return terms.original_balance * (1.0 - months / terms.term_months)
    return terms.original_balance * growth - terms.scheduled_payment * (growth - 1.0) / terms.monthly_rate
