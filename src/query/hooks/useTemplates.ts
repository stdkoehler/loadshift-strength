'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '@/query/fetcher';
import { queryKeys } from '@/query/keys';
import type { Cycle } from '@/lib/types';

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates(),
    queryFn: () => fetchJson<Cycle[]>('/api/templates'),
  });
}
