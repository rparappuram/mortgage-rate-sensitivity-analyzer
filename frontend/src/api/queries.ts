import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, ApiError } from './client'
import type { AnalysisRequest } from './types'

const FIFTEEN_MINUTES = 15 * 60 * 1000
const FIVE_MINUTES = 5 * 60 * 1000

function retryUnlessClientError(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < 2
}

export function useMarket() {
  return useQuery({
    queryKey: ['market'],
    queryFn: api.market,
    staleTime: FIFTEEN_MINUTES,
    refetchInterval: FIFTEEN_MINUTES,
    retry: retryUnlessClientError,
  })
}

export function useAnalysis(request: AnalysisRequest) {
  return useQuery({
    queryKey: ['analysis', request],
    queryFn: () => api.analyze(request),
    placeholderData: keepPreviousData,
    staleTime: FIVE_MINUTES,
    retry: retryUnlessClientError,
  })
}
