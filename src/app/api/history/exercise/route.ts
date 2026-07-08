import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getExerciseHistoryByName } from '@/server/queries/history';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  if (!name || !from || !to) return NextResponse.json({ error: 'name, from and to are required' }, { status: 400 });
  const result = await getExerciseHistoryByName(name, from, to);
  return NextResponse.json(result);
}
