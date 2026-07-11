import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { days, exercises, logs, sets } from '@/db/schema';
import { computeTarget, effectiveWeek, phaseForWeek, weekNumberFor, weekdayFor } from '@/lib/progression';
import type { ProgressionType } from '@/lib/progression';
import type { SessionExercise, SessionForDate, SessionSet } from '@/lib/types';
import { getCycle, getPhases } from './cycles';

export async function getSessionForDate(cycleId: number, dateIso: string): Promise<SessionForDate | null> {
  const cycle = await getCycle(cycleId);
  if (!cycle || !cycle.startDate) return null;

  const phaseRows = await getPhases(cycleId);
  const week = weekNumberFor(cycle.startDate, dateIso);
  const weekday = weekdayFor(dateIso);
  const effWeek = effectiveWeek(cycle.waveLengthWeeks, week);
  const phase = phaseForWeek(phaseRows, effWeek);
  const inCycle = week >= 1 && week <= cycle.lengthWeeks;

  const day = await db.query.days.findFirst({
    where: and(eq(days.cycleId, cycleId), eq(days.weekday, weekday)),
    orderBy: days.orderIndex,
  });

  if (!day) {
    return { cycle, date: dateIso, week, weekday, phase, inCycle, day: null, exercises: [], dayVolume: 0 };
  }
  if (day.isRest) {
    return { cycle, date: dateIso, week, weekday, phase, inCycle, day, exercises: [], dayVolume: 0, rest: true };
  }

  const exerciseRows = await db.query.exercises.findMany({
    where: eq(exercises.dayId, day.id),
    orderBy: exercises.orderIndex,
    with: { sets: { orderBy: sets.setIndex, with: { targets: true } } },
  });

  const logRows = await db.select().from(logs).where(and(eq(logs.cycleId, cycleId), eq(logs.logDate, dateIso)));
  const logMap = new Map(logRows.map((l) => [`${l.exerciseId}:${l.setIndex}`, l]));

  let dayVolume = 0;
  const outExercises: SessionExercise[] = exerciseRows.map((ex) => {
    const outSets: SessionSet[] = ex.sets.map((s) => {
      const { weight, reps, rir } = computeTarget(
        ex.progressionType as ProgressionType,
        s.targets,
        phaseRows,
        week,
        cycle.waveLengthWeeks
      );
      const log = logMap.get(`${ex.id}:${s.setIndex}`) ?? null;
      const actualWeight = log?.actualWeight ?? null;
      const actualReps = log?.actualReps ?? null;
      // Once a set has been logged, its planned values are frozen in the log row
      // (target* columns) so history stays accurate even if the exercise's targets are
      // edited later. Unlogged sets keep showing the live, currently-computed target.
      const usedTargetReps = log?.targetReps ?? reps;
      const usedTargetWeight = log?.targetWeight ?? weight;
      const usedTargetRir = log?.targetRir ?? rir;
      const usedWeight = actualWeight ?? usedTargetWeight;
      const usedReps = actualReps ?? usedTargetReps;
      const volume = (usedWeight || 0) * (usedReps || 0);
      dayVolume += volume;
      return {
        setIndex: s.setIndex,
        role: s.role,
        targetReps: usedTargetReps,
        targetWeight: usedTargetWeight,
        targetRir: usedTargetRir,
        actualReps: actualReps,
        actualWeight: actualWeight,
        done: log ? log.done : false,
        volume: Math.round(volume),
      };
    });
    return {
      id: ex.id,
      name: ex.name,
      progressionType: ex.progressionType,
      pauseMin: ex.pauseMin,
      notes: ex.notes,
      sets: outSets,
    };
  });

  return {
    cycle,
    date: dateIso,
    week,
    weekday,
    phase,
    inCycle,
    day,
    exercises: outExercises,
    dayVolume: Math.round(dayVolume),
  };
}
