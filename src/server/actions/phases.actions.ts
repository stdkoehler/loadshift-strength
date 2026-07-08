'use server';

import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { phases } from '@/db/schema';
import { phaseInputSchema, phaseUpdateSchema } from '@/zod/phase.schema';

export async function createPhaseAction(cycleId: number, input: unknown) {
  const data = phaseInputSchema.parse(input);
  const [{ m }] = await db
    .select({ m: sql<number>`coalesce(max(${phases.orderIndex}), 0)` })
    .from(phases)
    .where(eq(phases.cycleId, cycleId));
  const [row] = await db
    .insert(phases)
    .values({
      cycleId,
      name: data.name,
      startWeek: data.startWeek,
      endWeek: data.endWeek,
      color: data.color ?? null,
      orderIndex: m + 1,
    })
    .returning();
  return row;
}

export async function updatePhaseAction(id: number, input: unknown) {
  const data = phaseUpdateSchema.parse(input);
  const existing = (await db.select().from(phases).where(eq(phases.id, id)))[0];
  if (!existing) throw new Error('Phase nicht gefunden');
  await db
    .update(phases)
    .set({
      name: data.name ?? existing.name,
      startWeek: data.startWeek ?? existing.startWeek,
      endWeek: data.endWeek ?? existing.endWeek,
      color: data.color !== undefined ? data.color : existing.color,
    })
    .where(eq(phases.id, id));
  return (await db.select().from(phases).where(eq(phases.id, id)))[0];
}

export async function deletePhaseAction(id: number) {
  await db.delete(phases).where(eq(phases.id, id));
  return { ok: true };
}
