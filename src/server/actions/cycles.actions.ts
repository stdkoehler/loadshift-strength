'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cycles } from '@/db/schema';
import { cycleHasLogs, getCycle } from '@/server/queries/cycles';
import { cycleInputSchema, cycleUpdateSchema } from '@/zod/cycle.schema';

export async function createCycleAction(input: unknown) {
  const data = cycleInputSchema.parse(input);
  const [row] = await db
    .insert(cycles)
    .values({
      name: data.name,
      startDate: data.startDate,
      lengthWeeks: data.lengthWeeks ?? 8,
      waveLengthWeeks: data.waveLengthWeeks ?? null,
    })
    .returning();
  return row;
}

export async function updateCycleAction(id: number, input: unknown) {
  const data = cycleUpdateSchema.parse(input);
  const existing = await getCycle(id);
  if (!existing) throw new Error('Zyklus nicht gefunden');
  await db
    .update(cycles)
    .set({
      name: data.name ?? existing.name,
      startDate: data.startDate ?? existing.startDate,
      lengthWeeks: data.lengthWeeks ?? existing.lengthWeeks,
      waveLengthWeeks: data.waveLengthWeeks !== undefined ? data.waveLengthWeeks : existing.waveLengthWeeks,
    })
    .where(eq(cycles.id, id));
  return getCycle(id);
}

export async function deleteCycleAction(id: number) {
  // Any cycle with at least one log is permanent history (see the Verlauf tab) - never
  // let it cascade-delete via a plan cleanup. Templates never have logs against them
  // directly, so this only ever blocks deleting a loaded/run plan instance.
  if (await cycleHasLogs(id)) {
    throw new Error('Dieser Plan hat bereits geloggte Trainingstage und kann nicht geloescht werden.');
  }
  await db.delete(cycles).where(eq(cycles.id, id));
  return { ok: true };
}

export async function activateCycleAction(id: number) {
  const cycle = await getCycle(id);
  if (!cycle) throw new Error('Zyklus nicht gefunden');
  if (cycle.isTemplate) throw new Error('Eine Vorlage kann nicht direkt aktiviert werden - erst laden.');
  db.transaction((tx) => {
    tx.update(cycles).set({ isActive: false }).run();
    tx.update(cycles).set({ isActive: true }).where(eq(cycles.id, id)).run();
  });
  return { ok: true };
}
