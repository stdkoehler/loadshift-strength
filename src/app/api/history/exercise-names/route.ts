import { NextResponse } from 'next/server';
import { listLoggedExerciseNames } from '@/server/queries/history';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const names = await listLoggedExerciseNames();
  return NextResponse.json(names);
}
