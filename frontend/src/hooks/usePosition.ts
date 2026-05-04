import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { PositionRequest } from '../types/api';

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delayMs]);

  return debounced;
}

export function usePosition(params: PositionRequest) {
  const debounced = useDebounced(params, 150);

  return useQuery({
    queryKey: ['position', debounced],
    queryFn: () => api.analyzePosition(debounced),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
