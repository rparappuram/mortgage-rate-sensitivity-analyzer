import type {
  CurveTableResponse,
  PositionRequest,
  PositionResponse,
  RateCurveResponse,
} from '../types/api';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`GET ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getLiveRates: () => get<RateCurveResponse>('/api/rates/live'),

  getHistoricalRates: (date: string) =>
    get<RateCurveResponse>(`/api/rates/historical?date=${encodeURIComponent(date)}`),

  getCurveTable: (date?: string) =>
    get<CurveTableResponse>(
      date ? `/api/rates/curve?date=${encodeURIComponent(date)}` : '/api/rates/curve',
    ),

  analyzePosition: (req: PositionRequest) =>
    post<PositionResponse>('/api/position/analyze', req),
};
