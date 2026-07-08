import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getActiveCycle } from '@/server/queries/cycles';
import { getFullPlan } from '@/server/queries/plan';
import { getProgressForExercise } from '@/server/queries/progress';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const cycle = await getActiveCycle();
  if (!cycle) return NextResponse.json(null);

  const exerciseIdParam = request.nextUrl.searchParams.get('exercise_id');
  if (!exerciseIdParam) {
    const plan = await getFullPlan(cycle.id);
    const items = (plan?.days ?? []).flatMap((d) => d.exercises.map((e) => ({ id: e.id, name: e.name, day: d.name })));
    return NextResponse.json({ cycle, exercises: items });
  }

  const progress = await getProgressForExercise(cycle.id, Number(exerciseIdParam));
  return NextResponse.json(progress);
}
