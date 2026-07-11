import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/db/client';
import { exercises, logs } from '@/db/schema';
import { getCycle, getPhases } from './cycles';
import { getFullPlan } from './plan';
import { weekNumberFor } from '@/lib/progression';
import { todayIso } from '@/lib/date';
import type { AiExportExercise, AiExportLogEntry, AiExportPayload, AiExportSetTarget } from '@/lib/types';

const WD: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

export async function buildAiExport(cycleId: number, fromDate?: string, toDate?: string): Promise<AiExportPayload | null> {
  const cycle = await getCycle(cycleId);
  if (!cycle || !cycle.startDate) return null;

  const phaseRows = await getPhases(cycleId);
  const phaseNameById = new Map(phaseRows.map((p) => [p.id, p.name]));

  const full = await getFullPlan(cycleId);
  if (!full) return null;

  const from = fromDate || cycle.startDate;
  const to = toDate || todayIso();

  const logRows = await db
    .select({
      exerciseId: logs.exerciseId,
      logDate: logs.logDate,
      weekNumber: logs.weekNumber,
      setIndex: logs.setIndex,
      targetReps: logs.targetReps,
      targetWeight: logs.targetWeight,
      targetRir: logs.targetRir,
      actualReps: logs.actualReps,
      actualWeight: logs.actualWeight,
      actualRir: logs.actualRir,
      done: logs.done,
    })
    .from(logs)
    .innerJoin(exercises, eq(exercises.id, logs.exerciseId))
    .where(and(eq(logs.cycleId, cycleId), gte(logs.logDate, from), lte(logs.logDate, to)))
    .orderBy(asc(logs.logDate), asc(logs.setIndex));

  const logsByExercise = new Map<number, AiExportLogEntry[]>();
  for (const r of logRows) {
    const entry: AiExportLogEntry = {
      date: r.logDate,
      week: r.weekNumber,
      setIndex: r.setIndex,
      targetReps: r.targetReps,
      targetWeight: r.targetWeight,
      targetRir: r.targetRir,
      actualReps: r.actualReps,
      actualWeight: r.actualWeight,
      actualRir: r.actualRir,
      done: r.done,
    };
    if (!logsByExercise.has(r.exerciseId)) logsByExercise.set(r.exerciseId, []);
    logsByExercise.get(r.exerciseId)!.push(entry);
  }

  const exercisesOut: AiExportExercise[] = full.days.flatMap((d) =>
    d.exercises.map((ex) => ({
      day: `${WD[d.weekday]} · ${d.name}`,
      name: ex.name,
      progressionType: ex.progressionType,
      sets: ex.sets.map((s) => ({
        setIndex: s.setIndex,
        role: s.role,
        targets: s.targets.map(
          (t): AiExportSetTarget => ({
            phase: t.phaseId != null ? (phaseNameById.get(t.phaseId) ?? null) : null,
            reps: t.reps,
            baseWeight: t.baseWeight,
            incrementPerWeek: t.incrementPerWeek,
            rir: t.targetRir,
            incrementPerRepeat: t.incrementPerRepeat,
          })
        ),
      })),
      log: logsByExercise.get(ex.id) ?? [],
    }))
  );

  return {
    cycle: {
      name: cycle.name,
      startDate: cycle.startDate,
      currentWeek: weekNumberFor(cycle.startDate, todayIso()),
      lengthWeeks: cycle.lengthWeeks,
      waveLengthWeeks: cycle.waveLengthWeeks,
    },
    from,
    to,
    exercises: exercisesOut,
  };
}
