import { z } from 'zod';

export const dayInputSchema = z.object({
  weekday: z.number().int().min(1).max(7),
  name: z.string().min(1),
  focus: z.string().nullable().optional(),
  isRest: z.boolean().optional(),
});

export const dayUpdateSchema = dayInputSchema.partial();

export type DayInput = z.infer<typeof dayInputSchema>;
export type DayUpdateInput = z.infer<typeof dayUpdateSchema>;
