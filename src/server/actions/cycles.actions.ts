'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cycles } from '@/db/schema';
import { getCycle } from '@/server/queries/cycles';
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
  await db.delete(cycles).where(eq(cycles.id, id));
  return { ok: true };
}

export async function activateCycleAction(id: number) {
  db.transaction((tx) => {
    tx.update(cycles).set({ isActive: false }).run();
    tx.update(cycles).set({ isActive: true }).where(eq(cycles.id, id)).run();
  });
  return { ok: true };
}
