import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useRates() {
  return useQuery({
    queryKey: ['rates', 'live'],
    queryFn: api.getLiveRates,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
