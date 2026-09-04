import type { AnalysisRequest, AnalysisResponse, MarketResponse } from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown }
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((item: { msg?: string; loc?: unknown[] }) => `${(item.loc ?? []).slice(1).join('.')}: ${item.msg ?? ''}`)
        .join('; ')
    }
  } catch {
    return response.statusText
  }
  return response.statusText
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorDetail(response))
  }
  return (await response.json()) as T
}

export const api = {
  market: () => request<MarketResponse>('/api/market'),
  analyze: (body: AnalysisRequest) =>
    request<AnalysisResponse>('/api/analyze', { method: 'POST', body: JSON.stringify(body) }),
}
