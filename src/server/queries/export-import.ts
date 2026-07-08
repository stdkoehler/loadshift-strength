import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { exercises, logs } from '@/db/schema';
import { EXPORT_FORMAT, EXPORT_VERSION } from '@/lib/types';
import type { ExportDay, ExportLog, ExportPayload } from '@/lib/types';
import { getFullPlan } from './plan';

export async function exportCycle(cycleId: number, includeLogs: boolean): Promise<ExportPayload | null> {
  const full = await getFullPlan(cycleId);
  if (!full) return null;

  const phaseNameById = new Map(full.phases.map((p) => [p.id, p.name]));

  const days: ExportDay[] = full.days.map((d) => ({
    weekday: d.weekday,
    name: d.name,
    focus: d.focus,
    isRest: d.isRest,
    exercises: d.exercises.map((e) => ({
      name: e.name,
      progressionType: e.progressionType,
      pauseMin: e.pauseMin,
      notes: e.notes,
      sets: e.sets.map((s) => ({
        role: s.role,
        targets: s.targets.map((t) => ({
          phase: t.phaseId != null ? (phaseNameById.get(t.phaseId) ?? null) : null,
          reps: t.reps,
          baseWeight: t.baseWeight,
          incrementPerWeek: t.incrementPerWeek,
          rir: t.targetRir,
          incrementPerRepeat: t.incrementPerRepeat,
        })),
      })),
    })),
  }));

  const out: ExportPayload = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    cycle: {
      name: full.cycle.name,
      startDate: full.cycle.startDate,
      lengthWeeks: full.cycle.lengthWeeks,
      waveLengthWeeks: full.cycle.waveLengthWeeks,
    },
    phases: full.phases.map((p) => ({ name: p.name, startWeek: p.startWeek, endWeek: p.endWeek, color: p.color })),
    days,
  };

  if (includeLogs) {
    // Logs are addressed by (weekday, exercise position within that day) since exercise ids
    // are regenerated on import - names alone aren't unique across days (e.g. the same exercise twice).
    const dayExerciseOrder = new Map(full.days.map((d) => [d.id, d.exercises.map((e) => e.id)]));
    const logRows = await db
      .select({
        exerciseId: logs.exerciseId,
        setIndex: logs.setIndex,
        logDate: logs.logDate,
        actualReps: logs.actualReps,
        actualWeight: logs.actualWeight,
        done: logs.done,
        dayId: exercises.dayId,
      })
      .from(logs)
      .innerJoin(exercises, eq(exercises.id, logs.exerciseId))
      .where(and(eq(logs.cycleId, cycleId)))
      .orderBy(asc(logs.logDate));

    const dayWeekdayById = new Map(full.days.map((d) => [d.id, d.weekday]));

    out.logs = logRows
      .map((l): ExportLog => ({
        dayWeekday: dayWeekdayById.get(l.dayId) ?? -1,
        exerciseIndex: (dayExerciseOrder.get(l.dayId) || []).indexOf(l.exerciseId),
        setIndex: l.setIndex,
        date: l.logDate,
        actualReps: l.actualReps,
        actualWeight: l.actualWeight,
        done: l.done,
      }))
      .filter((l) => l.exerciseIndex !== -1);
  }

  return out;
}
