import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta

import httpx

TREASURY_URL = (
    "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/"
    "pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value_month={yyyymm}"
)

TENOR_FIELDS = {
    "BC_1MONTH": ("1M", 1 / 12),
    "BC_2MONTH": ("2M", 2 / 12),
    "BC_3MONTH": ("3M", 3 / 12),
    "BC_6MONTH": ("6M", 0.5),
    "BC_1YEAR": ("1Y", 1.0),
    "BC_2YEAR": ("2Y", 2.0),
    "BC_3YEAR": ("3Y", 3.0),
    "BC_5YEAR": ("5Y", 5.0),
    "BC_7YEAR": ("7Y", 7.0),
    "BC_10YEAR": ("10Y", 10.0),
    "BC_20YEAR": ("20Y", 20.0),
    "BC_30YEAR": ("30Y", 30.0),
}

NS = "http://schemas.microsoft.com/ado/2007/08/dataservices"
NS_M = "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata"


async def fetch_month(yyyymm: str) -> list[dict]:
    url = TREASURY_URL.format(yyyymm=yyyymm)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    return _parse_xml(resp.text)


def _parse_xml(xml_text: str) -> list[dict]:
    root = ET.fromstring(xml_text)
    entries = []
    for props in root.iter(f"{{{NS_M}}}properties"):
        row: dict = {}
        date_el = props.find(f"{{{NS}}}NEW_DATE")
        if date_el is None or not date_el.text:
            continue
        row["date"] = date_el.text[:10]
        for field, (label, years) in TENOR_FIELDS.items():
            el = props.find(f"{{{NS}}}{field}")
            if el is not None and el.text:
                row[label] = float(el.text) / 100.0
            else:
                row[label] = None
        entries.append(row)
    return sorted(entries, key=lambda r: r["date"])


async def fetch_latest() -> dict:
    today = date.today()
    yyyymm = today.strftime("%Y%m")
    rows = await fetch_month(yyyymm)
    if not rows:
        prev = (today.replace(day=1) - timedelta(days=1))
        rows = await fetch_month(prev.strftime("%Y%m"))
    return rows[-1]


async def fetch_for_date(target_date: str) -> dict:
    dt = datetime.strptime(target_date, "%Y-%m-%d").date()
    yyyymm = dt.strftime("%Y%m")
    rows = await fetch_month(yyyymm)
    if not rows:
        raise ValueError(f"No Treasury data available for {target_date}")
    best = min(rows, key=lambda r: abs(
        (datetime.strptime(r["date"], "%Y-%m-%d").date() - dt).days
    ))
    return best


def extract_key_rates(row: dict) -> dict[str, float]:
    out: dict[str, float] = {}
    for label in ["1M", "2M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]:
        v = row.get(label)
        if v is not None:
            out[label] = v
    return out
