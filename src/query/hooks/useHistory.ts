'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '@/query/fetcher';
import { queryKeys } from '@/query/keys';
import type { ExerciseHistoryResult, HistoryDay } from '@/lib/types';

export function useHistoryDays(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.historyDays(from, to),
    queryFn: () => fetchJson<HistoryDay[]>(`/api/history/days?from=${from}&to=${to}`),
  });
}

export function useHistoryExerciseNames(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.historyExerciseNames(from, to),
    queryFn: () => fetchJson<string[]>(`/api/history/exercise-names?from=${from}&to=${to}`),
  });
}

export function useHistoryExercise(name: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.historyExercise(name ?? '', from, to),
    queryFn: () => fetchJson<ExerciseHistoryResult>(`/api/history/exercise?name=${encodeURIComponent(name!)}&from=${from}&to=${to}`),
    enabled: name != null,
  });
}
