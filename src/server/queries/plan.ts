import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { days, exercises, sets } from '@/db/schema';
import { getCycle, getPhases } from './cycles';
import type { FullPlan } from '@/lib/types';

export async function getFullPlan(cycleId: number): Promise<FullPlan | null> {
  const cycle = await getCycle(cycleId);
  if (!cycle) return null;
  const phaseRows = await getPhases(cycleId);

  const dayRows = await db.query.days.findMany({
    where: eq(days.cycleId, cycleId),
    orderBy: [asc(days.orderIndex), asc(days.weekday)],
    with: {
      exercises: {
        orderBy: asc(exercises.orderIndex),
        with: {
          sets: {
            orderBy: asc(sets.setIndex),
            with: { targets: true },
          },
        },
      },
    },
  });

  return { cycle, phases: phaseRows, days: dayRows };
}
