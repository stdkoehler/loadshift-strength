import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cycles, phases } from '@/db/schema';

export async function listCycles() {
  return db.select().from(cycles).orderBy(desc(cycles.createdAt), desc(cycles.id));
}

export async function getCycle(id: number) {
  const rows = await db.select().from(cycles).where(eq(cycles.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getActiveCycle() {
  const active = await db.select().from(cycles).where(eq(cycles.isActive, true)).limit(1);
  if (active[0]) return active[0];
  const first = await db.select().from(cycles).orderBy(asc(cycles.id)).limit(1);
  return first[0] ?? null;
}

export async function getPhases(cycleId: number) {
  return db.query.phases.findMany({
    where: eq(phases.cycleId, cycleId),
    orderBy: [asc(phases.orderIndex), asc(phases.startWeek)],
  });
}
