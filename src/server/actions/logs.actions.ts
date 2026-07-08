'use server';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { logs } from '@/db/schema';
import { getActiveCycle } from '@/server/queries/cycles';
import { weekNumberFor } from '@/lib/progression';
import { logInputSchema } from '@/zod/log.schema';

export async function upsertLogAction(input: unknown) {
  const data = logInputSchema.parse(input);
  const cycle = await getActiveCycle();
  if (!cycle) throw new Error('Kein aktiver Zyklus');

  const weekNumber = weekNumberFor(cycle.startDate, data.logDate);
  const isEmpty = (data.actualReps == null) && (data.actualWeight == null) && !data.done;

  if (isEmpty) {
    await db
      .delete(logs)
      .where(and(eq(logs.exerciseId, data.exerciseId), eq(logs.setIndex, data.setIndex), eq(logs.logDate, data.logDate)));
    return { ok: true };
  }

  await db
    .insert(logs)
    .values({
      cycleId: cycle.id,
      exerciseId: data.exerciseId,
      setIndex: data.setIndex,
      logDate: data.logDate,
      weekNumber,
      actualReps: data.actualReps ?? null,
      actualWeight: data.actualWeight ?? null,
      done: data.done,
    })
    .onConflictDoUpdate({
      target: [logs.exerciseId, logs.setIndex, logs.logDate],
      set: {
        actualReps: data.actualReps ?? null,
        actualWeight: data.actualWeight ?? null,
        done: data.done,
        weekNumber,
      },
    });

  return { ok: true };
}
