'use server';

import { db } from '@/db/client';
import { cycles } from '@/db/schema';
import { getCycle } from '@/server/queries/cycles';
import { exportCycle } from '@/server/queries/export-import';
import { deleteCycleAction } from '@/server/actions/cycles.actions';
import { importCycleAction } from '@/server/actions/import.actions';
import { templateInputSchema, loadTemplateSchema, saveAsTemplateSchema } from '@/zod/template.schema';

export async function createTemplateAction(input: unknown) {
  const data = templateInputSchema.parse(input);
  const [row] = await db
    .insert(cycles)
    .values({
      name: data.name,
      startDate: null,
      lengthWeeks: data.lengthWeeks ?? 8,
      waveLengthWeeks: data.waveLengthWeeks ?? null,
      isTemplate: true,
    })
    .returning();
  return row;
}

export async function loadTemplateAction(input: unknown) {
  const data = loadTemplateSchema.parse(input);
  const template = await getCycle(data.templateId);
  if (!template || !template.isTemplate) throw new Error('Template not found');

  const payload = await exportCycle(data.templateId, false);
  if (!payload) throw new Error('Template not found');
  payload.cycle.startDate = data.startDate;

  return importCycleAction(payload, { activate: true, isTemplate: false });
}

export async function saveActivePlanAsTemplateAction(input: unknown) {
  const data = saveAsTemplateSchema.parse(input);
  const source = await getCycle(data.cycleId);
  if (!source) throw new Error('Plan not found');

  const payload = await exportCycle(data.cycleId, false);
  if (!payload) throw new Error('Plan not found');
  payload.cycle.name = data.name;

  if (data.overwriteTemplateId) {
    const existing = await getCycle(data.overwriteTemplateId);
    if (!existing || !existing.isTemplate) throw new Error('Template to overwrite not found');
    await deleteCycleAction(data.overwriteTemplateId);
  }

  return importCycleAction(payload, { activate: false, isTemplate: true });
}
