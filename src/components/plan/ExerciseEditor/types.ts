import type { ProgressionType } from '@/lib/progression';

export const ROLES = ['', 'Warm-up', 'Top-Satz', 'Back-off', 'Kraftausdauer-Touch'] as const;

export interface UniformVals {
  numSets: number | string;
  reps: number | string;
  weight: number | string;
  increment: number | string;
  rir: number | string;
}
export interface CustomRow {
  // Stable per-row id for drag-to-reorder (see SortableList) - never persisted, only
  // array order matters once buildPayload runs.
  _key: string;
  reps: number | string;
  weight: number | string;
  role: string;
  rir: number | string;
}
export interface PhaseVal {
  reps: number | string;
  weight: number | string;
  rir: number | string;
}
export interface CustomPhaseRow {
  _key: string;
  role: string;
  vals: Record<number, PhaseVal>;
}

export interface EditorState {
  name: string;
  progressionType: ProgressionType;
  pauseMin: number | string;
  notes: string;
  structure: 'uniform' | 'custom';
  activePhase: number | null;
  uniform: UniformVals;
  custom: CustomRow[];
  phaseVals: Record<number, PhaseVal>;
  customPhase: CustomPhaseRow[];
  // Phasen-only: added to every phase's baseWeight once per full wave repeat (see
  // cycle.waveLengthWeeks) - shifts the whole wave up together rather than per-phase.
  repeatIncrement: number | string;
}
