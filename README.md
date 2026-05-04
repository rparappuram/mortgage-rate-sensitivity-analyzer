# MRSA — Mortgage Rate Sensitivity Analyzer

> mrsa.app

Live US Treasury yield curve, bootstrapped zero rates, and real-time shock analysis for residential mortgage debt.

---

## What it does

**Rate environment** — Fetches live and historical US Treasury par rates. Bootstraps zero rates. Displays 3M, 2Y, 10Y, 30Y, and the 2Y–10Y spread with inversion signal.

**Position analytics** — Given a loan (balance, note rate, term, origination date, CPR), computes present value, price, current balance, WAL, modified duration, DV01, convexity, and coupon spread vs. 10Y par.

**Shock analysis** — Parallel shift, twist, and steepener scenarios. Live price impact, dollar P&L, and DV01-linear approximation. Full scenario table at –200 / –100 / –50 / base / +50 / +100 / +200 / +300 bps.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI · NumPy · httpx · Pydantic · uvicorn |
| Frontend | React 19 · TypeScript · Vite · TanStack Query v5 · Recharts 3 · Tailwind CSS |
| Data | US Department of the Treasury XML API (no key required) |
| Hosting | Azure App Service (backend) · Azure Static Web Apps (frontend) |

---

## Local development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

---

## Project structure

```
mrsa/
├── backend/
│   ├── main.py
│   ├── routers/
│   │   ├── rates.py
│   │   └── position.py
│   ├── services/
│   │   ├── treasury.py
│   │   ├── bootstrap.py
│   │   └── mortgage.py
│   ├── models/
│   │   ├── rates.py
│   │   └── position.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.ts
│   │   ├── types/api.ts
│   │   ├── hooks/
│   │   ├── components/
│   │   │   ├── Hero/
│   │   │   ├── Workspace/
│   │   │   └── shared/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── tailwind.config.ts
└── .github/
    └── workflows/
        ├── backend.yml
        └── frontend.yml
```

---

## Data source

US Department of the Treasury Daily Treasury Par Yield Curve Rates XML feed.  
No API key required. All computation runs server-side.

---

## License

MIT
