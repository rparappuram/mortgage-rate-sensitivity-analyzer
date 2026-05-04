import math
import numpy as np

TENORS_YEARS = [1 / 12, 2 / 12, 3 / 12, 0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0]
TENOR_LABELS = ["1M", "2M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]


def bootstrap_zero_rates(par_rates: dict[str, float]) -> dict[str, float]:
    known_tenors: list[float] = []
    known_zeros: list[float] = []

    for label, t in zip(TENOR_LABELS, TENORS_YEARS):
        par = par_rates.get(label)
        if par is None:
            continue

        if t <= 0.5:
            z = -math.log(1.0 / (1.0 + par * t)) / t
        else:
            freq = 2
            coupon = par / freq
            periods = int(round(t * freq))
            df_sum = 0.0
            for i in range(1, periods):
                ti = i / freq
                zi = _interp_zero(ti, known_tenors, known_zeros)
                df_sum += coupon * math.exp(-zi * ti)
            terminal_df = (1.0 + coupon) / (1.0 + par / 2) ** (2 * t) if not known_zeros else None

            if terminal_df is None or df_sum == 0.0:
                terminal_df = (1.0 - df_sum) / (1.0 + coupon)

            terminal_df = (1.0 - df_sum) / (1.0 + coupon)
            if terminal_df <= 0:
                continue
            z = -math.log(terminal_df) / t

        known_tenors.append(t)
        known_zeros.append(z)

    return dict(zip(
        [TENOR_LABELS[TENORS_YEARS.index(t)] for t in known_tenors],
        known_zeros
    ))


def compute_forward_rates(zero_rates: dict[str, float]) -> dict[str, float]:
    labels = [l for l in TENOR_LABELS if l in zero_rates]
    tenors = [TENORS_YEARS[TENOR_LABELS.index(l)] for l in labels]
    zeros = [zero_rates[l] for l in labels]

    forwards: dict[str, float] = {}
    for i, (label, t) in enumerate(zip(labels, tenors)):
        if i == 0:
            forwards[label] = zeros[0]
        else:
            t_prev = tenors[i - 1]
            z_prev = zeros[i - 1]
            z_curr = zeros[i]
            f = (z_curr * t - z_prev * t_prev) / (t - t_prev)
            forwards[label] = f

    return forwards


def interpolate_zero(tenor_years: float, zero_rates: dict[str, float]) -> float:
    labels = [l for l in TENOR_LABELS if l in zero_rates]
    tenors = [TENORS_YEARS[TENOR_LABELS.index(l)] for l in labels]
    zeros = [zero_rates[l] for l in labels]
    return float(np.interp(tenor_years, tenors, zeros))


def _interp_zero(t: float, known_tenors: list[float], known_zeros: list[float]) -> float:
    if not known_tenors:
        return 0.0
    return float(np.interp(t, known_tenors, known_zeros))
