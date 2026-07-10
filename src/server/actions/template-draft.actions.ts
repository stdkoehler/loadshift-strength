'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cycles, days, exercises, phases, sets, setTargets } from '@/db/schema';
import { getCycle } from '@/server/queries/cycles';
import { templateDraftSchema } from '@/zod/template-draft.schema';

// Persists a template draft built up client-side (see stores/template-draft-store.ts)
// back onto the same cycle row. Templates are never logged against directly, so it's
// safe to wipe and rebuild their phases/days (which cascade to exercises/sets/
// set_targets) rather than diffing - the same pattern importCycleAction already uses
// for "Vorlage laden", just targeting an existing cycleId instead of creating one.
export async function replaceTemplateContentAction(cycleId: number, input: unknown) {
  const existing = await getCycle(cycleId);
  if (!existing || !existing.isTemplate) throw new Error('Vorlage nicht gefunden');

  const data = templateDraftSchema.parse(input);

  db.transaction((tx) => {
    tx.update(cycles)
      .set({
        name: data.cycle.name,
        lengthWeeks: data.cycle.lengthWeeks,
        waveLengthWeeks: data.cycle.waveLengthWeeks ?? null,
      })
      .where(eq(cycles.id, cycleId))
      .run();

    tx.delete(phases).where(eq(phases.cycleId, cycleId)).run();
    tx.delete(days).where(eq(days.cycleId, cycleId)).run();

    const phaseNameToId = new Map<string, number>();
    data.phases.forEach((p, i) => {
      const id = tx
        .insert(phases)
        .values({ cycleId, name: p.name, startWeek: p.startWeek, endWeek: p.endWeek, color: p.color ?? null, orderIndex: i + 1 })
        .returning({ id: phases.id })
        .get().id;
      phaseNameToId.set(p.name, id);
    });

    data.days.forEach((d, di) => {
      const dayId = tx
        .insert(days)
        .values({ cycleId, weekday: d.weekday, name: d.name, focus: d.focus ?? null, isRest: d.isRest, orderIndex: di + 1 })
        .returning({ id: days.id })
        .get().id;

      (d.exercises || []).forEach((e, ei) => {
        const exId = tx
          .insert(exercises)
          .values({
            dayId,
            name: e.name,
            progressionType: e.progressionType || 'konstant',
            pauseMin: e.pauseMin ?? null,
            notes: e.notes ?? null,
            orderIndex: ei + 1,
          })
          .returning({ id: exercises.id })
          .get().id;

        (e.sets || []).forEach((s, si) => {
          const setId = tx
            .insert(sets)
            .values({ exerciseId: exId, setIndex: si + 1, role: s.role ?? null })
            .returning({ id: sets.id })
            .get().id;
          (s.targets || []).forEach((t) => {
            const phaseId = t.phase ? (phaseNameToId.get(t.phase) ?? null) : null;
            tx
              .insert(setTargets)
              .values({
                setId,
                phaseId,
                reps: t.reps ?? null,
                baseWeight: t.baseWeight ?? null,
                incrementPerWeek: t.incrementPerWeek ?? 0,
                targetRir: t.rir ?? null,
                incrementPerRepeat: t.incrementPerRepeat ?? 0,
              })
              .run();
          });
        });
      });
    });
  });

  return { id: cycleId };
}
