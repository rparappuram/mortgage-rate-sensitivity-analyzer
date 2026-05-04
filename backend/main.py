import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import position, rates

app = FastAPI(
    title="MRSA — Mortgage Rate Sensitivity Analyzer",
    version="1.0.0",
    description="Live Treasury yield curve, bootstrapped zero rates, and real-time shock analysis for residential mortgage debt.",
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
origins += ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rates.router)
app.include_router(position.router)


@app.get("/health")
def health():
    return {"status": "ok"}
