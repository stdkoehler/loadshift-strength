import { z } from 'zod';

export const templateInputSchema = z.object({
  name: z.string().min(1),
  lengthWeeks: z.number().int().positive().optional(),
  waveLengthWeeks: z.number().int().positive().nullable().optional(),
});

export const loadTemplateSchema = z.object({
  templateId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Erwartet YYYY-MM-DD'),
});

export const saveAsTemplateSchema = z.object({
  cycleId: z.number().int().positive(),
  name: z.string().min(1),
  overwriteTemplateId: z.number().int().positive().nullable().optional(),
});

export type TemplateInput = z.infer<typeof templateInputSchema>;
export type LoadTemplateInput = z.infer<typeof loadTemplateSchema>;
export type SaveAsTemplateInput = z.infer<typeof saveAsTemplateSchema>;
