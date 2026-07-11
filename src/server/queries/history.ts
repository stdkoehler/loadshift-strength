import { and, asc, eq, gte, lte, ne, or, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { cycles, exercises, logs, sets } from '@/db/schema';
import type { ExerciseHistoryPoint, ExerciseHistoryResult, HistoryDay } from '@/lib/types';

export async function getHistoryDays(fromDate: string, toDate: string): Promise<HistoryDay[]> {
  const rows = await db
    .select({
      date: logs.logDate,
      cycleId: logs.cycleId,
      cycleName: cycles.name,
      exerciseId: logs.exerciseId,
      exerciseName: exercises.name,
      exerciseOrder: exercises.orderIndex,
      setIndex: logs.setIndex,
      targetReps: logs.targetReps,
      targetWeight: logs.targetWeight,
      targetRir: logs.targetRir,
      actualReps: logs.actualReps,
      actualWeight: logs.actualWeight,
      done: logs.done,
    })
    .from(logs)
    .innerJoin(exercises, eq(exercises.id, logs.exerciseId))
    .innerJoin(cycles, eq(cycles.id, logs.cycleId))
    .where(and(gte(logs.logDate, fromDate), lte(logs.logDate, toDate)))
    .orderBy(asc(logs.logDate), asc(exercises.orderIndex), asc(logs.setIndex));

  const byDate = new Map<string, HistoryDay>();
  for (const r of rows) {
    let day = byDate.get(r.date);
    if (!day) {
      day = { date: r.date, cycleId: r.cycleId, cycleName: r.cycleName, sets: [] };
      byDate.set(r.date, day);
    }
    day.sets.push({
      exerciseId: r.exerciseId,
      exerciseName: r.exerciseName,
      setIndex: r.setIndex,
      targetReps: r.targetReps,
      targetWeight: r.targetWeight,
      targetRir: r.targetRir,
      actualReps: r.actualReps,
      actualWeight: r.actualWeight,
      done: r.done,
    });
  }
  // Newest first - this is a "what did I do recently" log, not a forward trend.
  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function listLoggedExerciseNames(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ name: exercises.name })
    .from(logs)
    .innerJoin(exercises, eq(exercises.id, logs.exerciseId))
    .orderBy(asc(exercises.name));
  return rows.map((r) => r.name);
}

export async function getExerciseHistoryByName(name: string, fromDate: string, toDate: string): Promise<ExerciseHistoryResult> {
  const rows = await db
    .select({
      date: logs.logDate,
      cycleName: cycles.name,
      targetReps: logs.targetReps,
      targetWeight: logs.targetWeight,
      actualReps: logs.actualReps,
      actualWeight: logs.actualWeight,
    })
    .from(logs)
    .innerJoin(exercises, eq(exercises.id, logs.exerciseId))
    .innerJoin(cycles, eq(cycles.id, logs.cycleId))
    .innerJoin(sets, and(eq(sets.exerciseId, logs.exerciseId), eq(sets.setIndex, logs.setIndex)))
    .where(
      and(
        eq(exercises.name, name),
        gte(logs.logDate, fromDate),
        lte(logs.logDate, toDate),
        // Warm-up sets are ramp-up, not the working stimulus - exclude them from the
        // trend, matching getProgressForExercise's convention.
        or(isNull(sets.role), ne(sets.role, 'Warm-up'))
      )
    )
    .orderBy(asc(logs.logDate));

  const byDate = new Map<
    string,
    { cycleName: string; targetTop: number | null; actualTop: number | null; volumeTarget: number; volumeActual: number }
  >();
  for (const r of rows) {
    let d = byDate.get(r.date);
    if (!d) {
      d = { cycleName: r.cycleName, targetTop: null, actualTop: null, volumeTarget: 0, volumeActual: 0 };
      byDate.set(r.date, d);
    }
    if (r.targetWeight != null && (d.targetTop == null || r.targetWeight > d.targetTop)) d.targetTop = r.targetWeight;
    if (r.actualWeight != null && (d.actualTop == null || r.actualWeight > d.actualTop)) d.actualTop = r.actualWeight;
    d.volumeTarget += (r.targetWeight || 0) * (r.targetReps || 0);
    d.volumeActual += (r.actualWeight || 0) * (r.actualReps || 0);
  }

  const points: ExerciseHistoryPoint[] = Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, d]) => ({
      date,
      cycleName: d.cycleName,
      targetTop: d.targetTop,
      actualTop: d.actualTop,
      volumeTarget: Math.round(d.volumeTarget),
      volumeActual: Math.round(d.volumeActual),
    }));

  return { exerciseName: name, points };
}
