'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '@/query/fetcher';
import { queryKeys } from '@/query/keys';
import type { FullPlan } from '@/lib/types';

export function usePlan(cycleId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.plan(cycleId ?? -1),
    queryFn: () => fetchJson<FullPlan>(`/api/plan/${cycleId}`),
    enabled: cycleId != null,
  });
}
