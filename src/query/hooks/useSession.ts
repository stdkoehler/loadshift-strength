'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '@/query/fetcher';
import { queryKeys } from '@/query/keys';
import type { SessionForDate } from '@/lib/types';

export function useSession(date: string) {
  return useQuery({
    queryKey: queryKeys.session(date),
    queryFn: () => fetchJson<SessionForDate | null>(`/api/session?date=${date}`),
  });
}
