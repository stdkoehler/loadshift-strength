import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { exercises, logs, sets } from '@/db/schema';
import { computeTarget } from '@/lib/progression';
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
    let sollTop: number | null = null;
    let volumeSoll = 0;
    for (const s of workingSets) {
      const { weight, reps } = computeTarget(ex.progressionType as ProgressionType, s.targets, phaseRows, w, cycle.waveLengthWeeks);
      if (weight != null && (sollTop == null || weight > sollTop)) sollTop = weight;
      volumeSoll += (weight || 0) * (reps || 0);
    }
    weeks.push({ week: w, sollTop, istTop: null, volumeSoll: Math.round(volumeSoll), volumeIst: 0 });
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
    for (const l of arr) {
      if (l.actualWeight != null && (topW == null || l.actualWeight > topW)) topW = l.actualWeight;
      volI += (l.actualWeight || 0) * (l.actualReps || 0);
    }
    weeks[w - 1].istTop = topW;
    weeks[w - 1].volumeIst = Math.round(volI);
  }

  return {
    exercise: { id: ex.id, name: ex.name, progressionType: ex.progressionType },
    cycle,
    weeks,
  };
}
