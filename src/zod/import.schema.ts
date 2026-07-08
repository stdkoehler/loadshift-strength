import { z } from 'zod';

const exportSetTargetSchema = z.object({
  phase: z.string().nullable(),
  reps: z.number().nullable(),
  baseWeight: z.number().nullable(),
  incrementPerWeek: z.number(),
  rir: z.number().nullable().optional(),
  incrementPerRepeat: z.number().optional(),
});

const exportSetSchema = z.object({
  role: z.string().nullable(),
  targets: z.array(exportSetTargetSchema),
});

const exportExerciseSchema = z.object({
  name: z.string(),
  progressionType: z.string(),
  pauseMin: z.number().nullable(),
  notes: z.string().nullable(),
  sets: z.array(exportSetSchema),
});

const exportDaySchema = z.object({
  weekday: z.number(),
  name: z.string(),
  focus: z.string().nullable(),
  isRest: z.boolean(),
  exercises: z.array(exportExerciseSchema),
});

const exportPhaseSchema = z.object({
  name: z.string(),
  startWeek: z.number(),
  endWeek: z.number(),
  color: z.string().nullable(),
});

const exportLogSchema = z.object({
  dayWeekday: z.number(),
  exerciseIndex: z.number(),
  setIndex: z.number(),
  date: z.string(),
  actualReps: z.number().nullable(),
  actualWeight: z.number().nullable(),
  done: z.boolean(),
});

// Note: `format`/`version` are checked separately (with a friendlier error) before this
// full schema runs, so a completely garbage file gets one clean message instead of a
// wall of field-level Zod issues.
export const importPayloadSchema = z.object({
  format: z.string(),
  version: z.number(),
  exportedAt: z.string().optional(),
  cycle: z.object({
    name: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Erwartet YYYY-MM-DD'),
    lengthWeeks: z.number().int().positive(),
    waveLengthWeeks: z.number().int().positive().nullable().optional(),
  }),
  phases: z.array(exportPhaseSchema).default([]),
  days: z.array(exportDaySchema).default([]),
  logs: z.array(exportLogSchema).optional(),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
