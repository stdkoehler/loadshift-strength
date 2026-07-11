export const queryKeys = {
  activeCycle: () => ['active-cycle'] as const,
  session: (date: string) => ['session', date] as const,
  plan: (cycleId: number) => ['plan', cycleId] as const,
  progressList: () => ['progress-list'] as const,
  progress: (exerciseId: number) => ['progress', exerciseId] as const,
  templates: () => ['templates'] as const,
  historyDays: (from: string, to: string) => ['history-days', from, to] as const,
  historyExerciseNames: (from: string, to: string) => ['history-exercise-names', from, to] as const,
  historyExercise: (name: string, from: string, to: string) => ['history-exercise', name, from, to] as const,
};
