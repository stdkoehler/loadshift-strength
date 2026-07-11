import type { cycles, days, exercises, logs, phases, setTargets, sets } from '@/db/schema';

export type Cycle = typeof cycles.$inferSelect;
export type Phase = typeof phases.$inferSelect;
export type Day = typeof days.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Set = typeof sets.$inferSelect;
export type SetTargetRow = typeof setTargets.$inferSelect;
export type Log = typeof logs.$inferSelect;

export interface SetWithTargets extends Set {
  targets: SetTargetRow[];
}
export interface ExerciseWithSets extends Exercise {
  sets: SetWithTargets[];
}
export interface DayWithExercises extends Day {
  exercises: ExerciseWithSets[];
}

export interface FullPlan {
  cycle: Cycle;
  phases: Phase[];
  days: DayWithExercises[];
}

export interface SessionSet {
  setIndex: number;
  role: string | null;
  targetReps: number | null;
  targetWeight: number | null;
  targetRir: number | null;
  actualReps: number | null;
  actualWeight: number | null;
  actualRir: number | null;
  done: boolean;
  volume: number;
}

export interface SessionExercise {
  id: number;
  name: string;
  progressionType: string;
  pauseMin: number | null;
  notes: string | null;
  sets: SessionSet[];
}

export interface SessionForDate {
  cycle: Cycle;
  date: string;
  week: number;
  weekday: number;
  phase: Phase | null;
  inCycle: boolean;
  day: Day | null;
  exercises: SessionExercise[];
  dayVolume: number;
  rest?: boolean;
}

export interface ProgressWeek {
  week: number;
  targetTop: number | null;
  actualTop: number | null;
  volumeTarget: number;
  volumeActual: number;
  targetRir: number | null;
  actualRir: number | null;
}

export interface ProgressResult {
  exercise: { id: number; name: string; progressionType: string };
  cycle: Cycle;
  weeks: ProgressWeek[];
}

// ---------- history (calendar-date tracking, independent of the active plan) ----------

export interface HistorySetEntry {
  exerciseId: number;
  exerciseName: string;
  setIndex: number;
  targetReps: number | null;
  targetWeight: number | null;
  targetRir: number | null;
  actualReps: number | null;
  actualWeight: number | null;
  actualRir: number | null;
  done: boolean;
}

export interface HistoryDay {
  date: string;
  cycleId: number;
  cycleName: string;
  sets: HistorySetEntry[];
}

export interface ExerciseHistoryPoint {
  date: string;
  cycleName: string;
  targetTop: number | null;
  actualTop: number | null;
  volumeTarget: number;
  volumeActual: number;
  targetRir: number | null;
  actualRir: number | null;
}

export interface ExerciseHistoryResult {
  exerciseName: string;
  points: ExerciseHistoryPoint[];
}

// ---------- portable export/import JSON shape ----------

export const EXPORT_FORMAT = 'workout-plan-export';
export const EXPORT_VERSION = 1;

export interface ExportSetTarget {
  phase: string | null;
  reps: number | null;
  baseWeight: number | null;
  incrementPerWeek: number;
  rir: number | null;
  incrementPerRepeat: number;
}
export interface ExportSet {
  role: string | null;
  targets: ExportSetTarget[];
}
export interface ExportExercise {
  name: string;
  progressionType: string;
  pauseMin: number | null;
  notes: string | null;
  sets: ExportSet[];
}
export interface ExportDay {
  weekday: number;
  name: string;
  focus: string | null;
  isRest: boolean;
  exercises: ExportExercise[];
}
export interface ExportPhase {
  name: string;
  startWeek: number;
  endWeek: number;
  color: string | null;
}
export interface ExportLog {
  dayWeekday: number;
  exerciseIndex: number;
  setIndex: number;
  date: string;
  actualReps: number | null;
  actualWeight: number | null;
  actualRir: number | null;
  done: boolean;
}
export interface ExportPayload {
  format: string;
  version: number;
  exportedAt: string;
  cycle: { name: string; startDate: string; lengthWeeks: number; waveLengthWeeks: number | null };
  phases: ExportPhase[];
  days: ExportDay[];
  logs?: ExportLog[];
}

// ---------- AI export: plan + actual results, for pasting into an LLM ----------
// Deliberately not the round-trip import format - no ids, no notes/pauseMin, just
// enough structure + per-set history for an LLM to reason about progression.

export interface AiExportSetTarget {
  phase: string | null;
  reps: number | null;
  baseWeight: number | null;
  incrementPerWeek: number;
  rir: number | null;
  incrementPerRepeat: number;
}

export interface AiExportSet {
  setIndex: number;
  role: string | null;
  targets: AiExportSetTarget[];
}

export interface AiExportLogEntry {
  date: string;
  week: number;
  setIndex: number;
  targetReps: number | null;
  targetWeight: number | null;
  targetRir: number | null;
  actualReps: number | null;
  actualWeight: number | null;
  actualRir: number | null;
  done: boolean;
}

export interface AiExportExercise {
  day: string;
  name: string;
  progressionType: string;
  sets: AiExportSet[];
  log: AiExportLogEntry[];
}

export interface AiExportPayload {
  cycle: { name: string; startDate: string; currentWeek: number; lengthWeeks: number; waveLengthWeeks: number | null };
  from: string;
  to: string;
  exercises: AiExportExercise[];
}
