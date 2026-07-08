import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cycles, logs, phases } from '@/db/schema';

export async function listCycles() {
  return db
    .select()
    .from(cycles)
    .where(eq(cycles.isTemplate, false))
    .orderBy(desc(cycles.createdAt), desc(cycles.id));
}

export async function listTemplates() {
  return db.select().from(cycles).where(eq(cycles.isTemplate, true)).orderBy(asc(cycles.name));
}

export async function getCycle(id: number) {
  const rows = await db.select().from(cycles).where(eq(cycles.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getActiveCycle() {
  const active = await db
    .select()
    .from(cycles)
    .where(and(eq(cycles.isActive, true), eq(cycles.isTemplate, false)))
    .limit(1);
  if (active[0]) return active[0];
  const first = await db
    .select()
    .from(cycles)
    .where(eq(cycles.isTemplate, false))
    .orderBy(asc(cycles.id))
    .limit(1);
  return first[0] ?? null;
}

export async function cycleHasLogs(cycleId: number): Promise<boolean> {
  const rows = await db.select({ id: logs.id }).from(logs).where(eq(logs.cycleId, cycleId)).limit(1);
  return rows.length > 0;
}

export async function getPhases(cycleId: number) {
  return db.query.phases.findMany({
    where: eq(phases.cycleId, cycleId),
    orderBy: [asc(phases.orderIndex), asc(phases.startWeek)],
  });
}
