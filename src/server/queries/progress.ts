import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { exercises, logs, sets } from '@/db/schema';
import { computeTarget, round } from '@/lib/progression';
import type { ProgressionType } from '@/lib/progression';
import type { ProgressResult, ProgressWeek } from '@/lib/types';
import { getCycle, getPhases } from './cycles';

export async function getProgressForExercise(cycleId: number, exerciseId: number): Promise<ProgressResult | null> {
  const cycle = await getCycle(cycleId);
  if (!cycle) return null;
  const phaseRows = await getPhases(cycleId);

  const ex = await db.query.exercises.findFirst({
    where: eq(exercises.id, exerciseId),
    with: { sets: { orderBy: sets.setIndex, with: { targets: true } } },
  });
  if (!ex) return null;

  // Warm-up sets are ramp-up, not the working stimulus - excluding them keeps the
  // 1RM-trend/volume trend from being diluted by ramp weight/reps.
  const workingSets = ex.sets.filter((s) => s.role !== 'Warm-up');
  const workingSetIndexes = new Set(workingSets.map((s) => s.setIndex));

  const weeks: ProgressWeek[] = [];
  for (let w = 1; w <= cycle.lengthWeeks; w++) {
    let targetTop: number | null = null;
    let volumeTarget = 0;
    let rirSum = 0;
    let rirCount = 0;
    for (const s of workingSets) {
      const { weight, reps, rir } = computeTarget(ex.progressionType as ProgressionType, s.targets, phaseRows, w, cycle.waveLengthWeeks);
      if (weight != null && (targetTop == null || weight > targetTop)) targetTop = weight;
      volumeTarget += (weight || 0) * (reps || 0);
      if (rir != null) {
        rirSum += rir;
        rirCount += 1;
      }
    }
    weeks.push({
      week: w,
      targetTop,
      actualTop: null,
      volumeTarget: Math.round(volumeTarget),
      volumeActual: 0,
      targetRir: rirCount > 0 ? round(rirSum / rirCount) : null,
      actualRir: null,
    });
  }

  const logRows = (
    await db.select().from(logs).where(and(eq(logs.exerciseId, exerciseId), eq(logs.cycleId, cycleId)))
  ).filter((l) => workingSetIndexes.has(l.setIndex));
  const byWeek = new Map<number, typeof logRows>();
  for (const l of logRows) {
    if (!byWeek.has(l.weekNumber)) byWeek.set(l.weekNumber, []);
    byWeek.get(l.weekNumber)!.push(l);
  }
  for (const [w, arr] of byWeek.entries()) {
    if (w < 1 || w > cycle.lengthWeeks) continue;
    let topW: number | null = null;
    let volI = 0;
    let rirSum = 0;
    let rirCount = 0;
    for (const l of arr) {
      if (l.actualWeight != null && (topW == null || l.actualWeight > topW)) topW = l.actualWeight;
      volI += (l.actualWeight || 0) * (l.actualReps || 0);
      if (l.actualRir != null) {
        rirSum += l.actualRir;
        rirCount += 1;
      }
    }
    weeks[w - 1].actualTop = topW;
    weeks[w - 1].volumeActual = Math.round(volI);
    weeks[w - 1].actualRir = rirCount > 0 ? round(rirSum / rirCount) : null;
  }

  return {
    exercise: { id: ex.id, name: ex.name, progressionType: ex.progressionType },
    cycle,
    weeks,
  };
}
