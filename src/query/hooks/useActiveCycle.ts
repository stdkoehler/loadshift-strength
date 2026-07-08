'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '@/query/fetcher';
import { queryKeys } from '@/query/keys';
import type { Cycle } from '@/lib/types';

export function useActiveCycle() {
  return useQuery({
    queryKey: queryKeys.activeCycle(),
    queryFn: () => fetchJson<Cycle | null>('/api/cycle/active'),
  });
}
