'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '@/query/fetcher';
import { queryKeys } from '@/query/keys';
import type { Cycle, ProgressResult } from '@/lib/types';

export interface ProgressListItem {
  id: number;
  name: string;
  day: string;
  weekday: number;
}
export interface ProgressListResponse {
  cycle: Cycle;
  exercises: ProgressListItem[];
}

export function useProgressList() {
  return useQuery({
    queryKey: queryKeys.progressList(),
    queryFn: () => fetchJson<ProgressListResponse | null>('/api/progress'),
  });
}

export function useProgress(exerciseId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.progress(exerciseId ?? -1),
    queryFn: () => fetchJson<ProgressResult | null>(`/api/progress?exercise_id=${exerciseId}`),
    enabled: exerciseId != null,
  });
}
