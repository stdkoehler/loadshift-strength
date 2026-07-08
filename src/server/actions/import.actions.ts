'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cycles, days, exercises, logs, phases, sets, setTargets } from '@/db/schema';
import { weekNumberFor } from '@/lib/progression';
import { EXPORT_FORMAT } from '@/lib/types';
import { importPayloadSchema } from '@/zod/import.schema';

export async function importCycleAction(input: unknown, { activate = true }: { activate?: boolean } = {}) {
  if (!input || typeof input !== 'object' || (input as { format?: unknown }).format !== EXPORT_FORMAT) {
    throw new Error('Ungueltiges Plan-Format');
  }
  const data = importPayloadSchema.parse(input);

  const cycleId = db.transaction((tx) => {
    const newCycleId = tx
      .insert(cycles)
      .values({
        name: data.cycle.name || 'Importierter Zyklus',
        startDate: data.cycle.startDate,
        lengthWeeks: data.cycle.lengthWeeks || 8,
        waveLengthWeeks: data.cycle.waveLengthWeeks ?? null,
      })
      .returning({ id: cycles.id })
      .get().id;

    const phaseNameToId = new Map<string, number>();
    data.phases.forEach((p, i) => {
      const id = tx
        .insert(phases)
        .values({
          cycleId: newCycleId,
          name: p.name,
          startWeek: p.startWeek,
          endWeek: p.endWeek,
          color: p.color ?? null,
          orderIndex: i + 1,
        })
        .returning({ id: phases.id })
        .get().id;
      phaseNameToId.set(p.name, id);
    });

    const exercisesByWeekday = new Map<number, number[]>(); // weekday -> [exerciseId, ...] in day order

    data.days.forEach((d, di) => {
      const dayId = tx
        .insert(days)
        .values({
          cycleId: newCycleId,
          weekday: d.weekday,
          name: d.name,
          focus: d.focus ?? null,
          isRest: d.isRest,
          orderIndex: di + 1,
        })
        .returning({ id: days.id })
        .get().id;

      const exIds: number[] = [];
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
        exIds.push(exId);
      });
      exercisesByWeekday.set(d.weekday, exIds);
    });

    if (Array.isArray(data.logs)) {
      for (const l of data.logs) {
        const exId = (exercisesByWeekday.get(l.dayWeekday) || [])[l.exerciseIndex];
        if (!exId || !l.date) continue;
        const week = weekNumberFor(data.cycle.startDate, l.date);
        tx
          .insert(logs)
          .values({
            cycleId: newCycleId,
            exerciseId: exId,
            setIndex: l.setIndex,
            logDate: l.date,
            weekNumber: week,
            actualReps: l.actualReps ?? null,
            actualWeight: l.actualWeight ?? null,
            done: l.done,
          })
          .run();
      }
    }

    if (activate) {
      tx.update(cycles).set({ isActive: false }).run();
      tx.update(cycles).set({ isActive: true }).where(eq(cycles.id, newCycleId)).run();
    }

    return newCycleId;
  });

  return { id: cycleId };
}
