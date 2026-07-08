'use server';

import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { days } from '@/db/schema';
import { dayInputSchema, dayUpdateSchema } from '@/zod/day.schema';

export async function createDayAction(cycleId: number, input: unknown) {
  const data = dayInputSchema.parse(input);
  const [{ m }] = await db
    .select({ m: sql<number>`coalesce(max(${days.orderIndex}), 0)` })
    .from(days)
    .where(eq(days.cycleId, cycleId));
  const [row] = await db
    .insert(days)
    .values({
      cycleId,
      weekday: data.weekday,
      name: data.name,
      focus: data.focus ?? null,
      isRest: data.isRest ?? false,
      orderIndex: m + 1,
    })
    .returning();
  return row;
}

export async function updateDayAction(id: number, input: unknown) {
  const data = dayUpdateSchema.parse(input);
  const existing = (await db.select().from(days).where(eq(days.id, id)))[0];
  if (!existing) throw new Error('Tag nicht gefunden');
  await db
    .update(days)
    .set({
      name: data.name ?? existing.name,
      focus: data.focus !== undefined ? data.focus : existing.focus,
      weekday: data.weekday ?? existing.weekday,
      isRest: data.isRest ?? existing.isRest,
    })
    .where(eq(days.id, id));
  return (await db.select().from(days).where(eq(days.id, id)))[0];
}

export async function deleteDayAction(id: number) {
  await db.delete(days).where(eq(days.id, id));
  return { ok: true };
}
