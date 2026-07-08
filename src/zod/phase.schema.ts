import { z } from 'zod';

export const phaseInputSchema = z.object({
  name: z.string().min(1),
  startWeek: z.number().int().positive(),
  endWeek: z.number().int().positive(),
  color: z.string().nullable().optional(),
});

export const phaseUpdateSchema = phaseInputSchema.partial();

export type PhaseInput = z.infer<typeof phaseInputSchema>;
export type PhaseUpdateInput = z.infer<typeof phaseUpdateSchema>;
