import { z } from 'zod';

export const logInputSchema = z.object({
  exerciseId: z.number().int().positive(),
  setIndex: z.number().int().positive(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Erwartet YYYY-MM-DD'),
  actualReps: z.number().int().nullable().optional(),
  actualWeight: z.number().nullable().optional(),
  done: z.boolean().optional().default(false),
});

export type LogInput = z.infer<typeof logInputSchema>;
