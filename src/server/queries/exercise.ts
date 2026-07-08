import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { exercises, sets } from '@/db/schema';

export async function getExerciseFull(id: number) {
  return db.query.exercises.findFirst({
    where: eq(exercises.id, id),
    with: { sets: { orderBy: sets.setIndex, with: { targets: true } } },
  });
}
