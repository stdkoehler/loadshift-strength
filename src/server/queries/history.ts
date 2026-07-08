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
      sollReps: logs.sollReps,
      sollWeight: logs.sollWeight,
      sollRir: logs.sollRir,
      istReps: logs.actualReps,
      istWeight: logs.actualWeight,
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
      sollReps: r.sollReps,
      sollWeight: r.sollWeight,
      sollRir: r.sollRir,
      istReps: r.istReps,
      istWeight: r.istWeight,
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
      sollReps: logs.sollReps,
      sollWeight: logs.sollWeight,
      istReps: logs.actualReps,
      istWeight: logs.actualWeight,
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
    { cycleName: string; sollTop: number | null; istTop: number | null; volumeSoll: number; volumeIst: number }
  >();
  for (const r of rows) {
    let d = byDate.get(r.date);
    if (!d) {
      d = { cycleName: r.cycleName, sollTop: null, istTop: null, volumeSoll: 0, volumeIst: 0 };
      byDate.set(r.date, d);
    }
    if (r.sollWeight != null && (d.sollTop == null || r.sollWeight > d.sollTop)) d.sollTop = r.sollWeight;
    if (r.istWeight != null && (d.istTop == null || r.istWeight > d.istTop)) d.istTop = r.istWeight;
    d.volumeSoll += (r.sollWeight || 0) * (r.sollReps || 0);
    d.volumeIst += (r.istWeight || 0) * (r.istReps || 0);
  }

  const points: ExerciseHistoryPoint[] = Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, d]) => ({
      date,
      cycleName: d.cycleName,
      sollTop: d.sollTop,
      istTop: d.istTop,
      volumeSoll: Math.round(d.volumeSoll),
      volumeIst: Math.round(d.volumeIst),
    }));

  return { exerciseName: name, points };
}
