export const queryKeys = {
  activeCycle: () => ['active-cycle'] as const,
  session: (date: string) => ['session', date] as const,
  plan: (cycleId: number) => ['plan', cycleId] as const,
  progressList: () => ['progress-list'] as const,
  progress: (exerciseId: number) => ['progress', exerciseId] as const,
};
