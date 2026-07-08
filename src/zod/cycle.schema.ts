import { z } from 'zod';

export const cycleInputSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Erwartet YYYY-MM-DD'),
  lengthWeeks: z.number().int().positive().optional(),
  waveLengthWeeks: z.number().int().positive().nullable().optional(),
});

export const cycleUpdateSchema = cycleInputSchema.partial();

export type CycleInput = z.infer<typeof cycleInputSchema>;
export type CycleUpdateInput = z.infer<typeof cycleUpdateSchema>;
