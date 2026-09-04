from datetime import date

from app.data.mortgage_rates import parse_fred_csv, parse_pmms_csv
from app.data.treasury import parse_yield_curve_xml

YIELD_CURVE_XML = """<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices"
      xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
  <entry><content type="application/xml"><m:properties>
    <d:NEW_DATE m:type="Edm.DateTime">2026-09-04T00:00:00</d:NEW_DATE>
    <d:BC_1MONTH m:type="Edm.Double">3.79</d:BC_1MONTH>
    <d:BC_1_5MONTH m:type="Edm.Double">3.83</d:BC_1_5MONTH>
    <d:BC_10YEAR m:type="Edm.Double">4.78</d:BC_10YEAR>
    <d:BC_30YEAR m:type="Edm.Double">5.24</d:BC_30YEAR>
  </m:properties></content></entry>
  <entry><content type="application/xml"><m:properties>
    <d:NEW_DATE m:type="Edm.DateTime">2026-09-03T00:00:00</d:NEW_DATE>
    <d:BC_1MONTH m:type="Edm.Double">3.80</d:BC_1MONTH>
    <d:BC_10YEAR m:type="Edm.Double">4.76</d:BC_10YEAR>
  </m:properties></content></entry>
</feed>"""

PMMS_CSV = """date,pmms30,pmms30p,pmms15,pmms15p,pmms51,pmms51p,pmms51m,pmms51spread
8/27/2026,6.66,,5.98,,,,,
9/3/2026,6.71,,6.04,,,,,
4/2/1971,7.33, ,,,,,,
"""

FRED_CSV = """observation_date,MORTGAGE30US
2026-08-27,6.66
2026-09-03,.
"""


def test_yield_curve_xml_is_parsed_and_sorted() -> None:
    observations = parse_yield_curve_xml(YIELD_CURVE_XML)
    assert [observation.observed_on for observation in observations] == [date(2026, 9, 3), date(2026, 9, 4)]
    assert observations[-1].par_rates_pct == {"1M": 3.79, "10Y": 4.78, "30Y": 5.24}
    assert observations[-1].rate("2Y") is None


def test_pmms_csv_is_parsed_and_sorted() -> None:
    observations = parse_pmms_csv(PMMS_CSV)
    assert observations[0].observed_on == date(1971, 4, 2)
    assert observations[0].rate_15y_pct is None
    assert observations[-1].observed_on == date(2026, 9, 3)
    assert observations[-1].rate_30y_pct == 6.71
    assert observations[-1].rate_15y_pct == 6.04


def test_fred_csv_skips_missing_values() -> None:
    assert parse_fred_csv(FRED_CSV) == {date(2026, 8, 27): 6.66}
