import { z } from 'zod';

const setTargetSchema = z.object({
  phase: z.string().nullable(),
  reps: z.number().nullable(),
  baseWeight: z.number().nullable(),
  incrementPerWeek: z.number(),
  rir: z.number().nullable().optional(),
  incrementPerRepeat: z.number().optional(),
});

const setSchema = z.object({
  role: z.string().nullable(),
  targets: z.array(setTargetSchema),
});

const exerciseSchema = z.object({
  name: z.string(),
  progressionType: z.string(),
  pauseMin: z.number().nullable(),
  notes: z.string().nullable(),
  sets: z.array(setSchema),
});

const daySchema = z.object({
  weekday: z.number(),
  name: z.string(),
  focus: z.string().nullable(),
  isRest: z.boolean(),
  exercises: z.array(exerciseSchema),
});

const phaseSchema = z.object({
  name: z.string(),
  startWeek: z.number(),
  endWeek: z.number(),
  color: z.string().nullable(),
});

// Same shape as the portable export/import format, minus cycle.startDate - templates
// never have one.
export const templateDraftSchema = z.object({
  cycle: z.object({
    name: z.string(),
    lengthWeeks: z.number().int().positive(),
    waveLengthWeeks: z.number().int().positive().nullable().optional(),
  }),
  phases: z.array(phaseSchema).default([]),
  days: z.array(daySchema).default([]),
});

export type TemplateDraftInput = z.infer<typeof templateDraftSchema>;
