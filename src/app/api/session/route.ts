import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getActiveCycle } from '@/server/queries/cycles';
import { getSessionForDate } from '@/server/queries/session';
import { todayIso } from '@/lib/date';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const cycle = await getActiveCycle();
  if (!cycle) return NextResponse.json(null);
  const date = request.nextUrl.searchParams.get('date') || todayIso();
  const session = await getSessionForDate(cycle.id, date);
  return NextResponse.json(session);
}
