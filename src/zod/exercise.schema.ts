import { z } from 'zod';

export const setTargetInputSchema = z.object({
  phaseId: z.number().int().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  baseWeight: z.number().nullable().optional(),
  incrementPerWeek: z.number().optional(),
  targetRir: z.number().nullable().optional(),
  incrementPerRepeat: z.number().optional(),
});

export const setInputSchema = z.object({
  role: z.string().nullable().optional(),
  targets: z.array(setTargetInputSchema).default([]),
});

export const exerciseInputSchema = z.object({
  name: z.string().min(1),
  progressionType: z.enum(['constant', 'linear', 'phased']).default('constant'),
  pauseMin: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  sets: z.array(setInputSchema).default([]),
});

export const exerciseUpdateSchema = exerciseInputSchema.partial();

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type ExerciseUpdateInput = z.infer<typeof exerciseUpdateSchema>;
