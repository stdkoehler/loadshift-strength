import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { listLoggedExerciseNames } from '@/server/queries/history';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  if (!from || !to) return NextResponse.json([], { status: 400 });
  const names = await listLoggedExerciseNames(from, to);
  return NextResponse.json(names);
}
