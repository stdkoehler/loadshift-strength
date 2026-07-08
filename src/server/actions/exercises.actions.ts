'use server';

import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { exercises, sets, setTargets } from '@/db/schema';
import { getExerciseFull } from '@/server/queries/exercise';
import { exerciseInputSchema, type ExerciseInput } from '@/zod/exercise.schema';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '@/db/schema';

type Tx = BetterSQLite3Database<typeof schema>;

// Deletes all existing sets for the exercise (cascades to set_targets) and reinserts.
// Must run inside a synchronous db.transaction() callback (better-sqlite3 requires
// transaction callbacks to be synchronous - no await inside - or the commit fires
// before the awaited work actually runs).
function writeExerciseSets(tx: Tx, exerciseId: number, setsInput: ExerciseInput['sets']) {
  tx.delete(sets).where(eq(sets.exerciseId, exerciseId)).run();
  setsInput.forEach((s, i) => {
    const setId = tx
      .insert(sets)
      .values({ exerciseId, setIndex: i + 1, role: s.role ?? null })
      .returning({ id: sets.id })
      .get().id;
    (s.targets || []).forEach((t) => {
      tx
        .insert(setTargets)
        .values({
          setId,
          phaseId: t.phaseId ?? null,
          reps: t.reps ?? null,
          baseWeight: t.baseWeight ?? null,
          incrementPerWeek: t.incrementPerWeek ?? 0,
          targetRir: t.targetRir ?? null,
          incrementPerRepeat: t.incrementPerRepeat ?? 0,
        })
        .run();
    });
  });
}

export async function createExerciseAction(dayId: number, input: unknown) {
  const data = exerciseInputSchema.parse(input);
  const [{ m }] = await db
    .select({ m: sql<number>`coalesce(max(${exercises.orderIndex}), 0)` })
    .from(exercises)
    .where(eq(exercises.dayId, dayId));

  const exerciseId = db.transaction((tx) => {
    const id = tx
      .insert(exercises)
      .values({
        dayId,
        name: data.name,
        progressionType: data.progressionType,
        pauseMin: data.pauseMin ?? null,
        notes: data.notes ?? null,
        orderIndex: m + 1,
      })
      .returning({ id: exercises.id })
      .get().id;
    writeExerciseSets(tx, id, data.sets);
    return id;
  });

  return getExerciseFull(exerciseId);
}

export async function updateExerciseAction(id: number, input: unknown) {
  const data = exerciseInputSchema.parse(input);
  db.transaction((tx) => {
    tx.update(exercises)
      .set({
        name: data.name,
        progressionType: data.progressionType,
        pauseMin: data.pauseMin ?? null,
        notes: data.notes ?? null,
      })
      .where(eq(exercises.id, id))
      .run();
    writeExerciseSets(tx, id, data.sets);
  });
  return getExerciseFull(id);
}

export async function deleteExerciseAction(id: number) {
  await db.delete(exercises).where(eq(exercises.id, id));
  return { ok: true };
}

export async function reorderExercisesAction(dayId: number, orderedIds: number[]) {
  db.transaction((tx) => {
    orderedIds.forEach((id, i) => {
      tx.update(exercises).set({ orderIndex: i + 1 }).where(eq(exercises.id, id)).run();
    });
  });
  return { ok: true };
}
