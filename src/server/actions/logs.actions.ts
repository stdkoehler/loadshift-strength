'use server';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { exercises, logs, sets } from '@/db/schema';
import { getActiveCycle, getPhases } from '@/server/queries/cycles';
import { computeTarget, weekNumberFor } from '@/lib/progression';
import type { ProgressionType } from '@/lib/progression';
import { todayIso } from '@/lib/date';
import { logInputSchema } from '@/zod/log.schema';

export async function upsertLogAction(input: unknown) {
  const data = logInputSchema.parse(input);
  if (data.logDate !== todayIso()) {
    throw new Error('Nur der heutige Tag kann protokolliert werden.');
  }

  const cycle = await getActiveCycle();
  if (!cycle || !cycle.startDate) throw new Error('Kein aktiver Zyklus');

  const weekNumber = weekNumberFor(cycle.startDate, data.logDate);
  const isEmpty = (data.actualReps == null) && (data.actualWeight == null) && !data.done;

  if (isEmpty) {
    await db
      .delete(logs)
      .where(and(eq(logs.exerciseId, data.exerciseId), eq(logs.setIndex, data.setIndex), eq(logs.logDate, data.logDate)));
    return { ok: true };
  }

  const exercise = await db.query.exercises.findFirst({
    where: eq(exercises.id, data.exerciseId),
    with: { sets: { where: eq(sets.setIndex, data.setIndex), with: { targets: true } } },
  });
  if (!exercise) throw new Error('Uebung nicht gefunden');
  const setRow = exercise.sets[0];
  const phaseRows = await getPhases(cycle.id);
  const soll = setRow
    ? computeTarget(exercise.progressionType as ProgressionType, setRow.targets, phaseRows, weekNumber, cycle.waveLengthWeeks)
    : { weight: null, reps: null, rir: null };

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
      sollReps: soll.reps,
      sollWeight: soll.weight,
      sollRir: soll.rir,
    })
    .onConflictDoUpdate({
      target: [logs.exerciseId, logs.setIndex, logs.logDate],
      set: {
        actualReps: data.actualReps ?? null,
        actualWeight: data.actualWeight ?? null,
        done: data.done,
        weekNumber,
        sollReps: soll.reps,
        sollWeight: soll.weight,
        sollRir: soll.rir,
      },
    });

  return { ok: true };
}
