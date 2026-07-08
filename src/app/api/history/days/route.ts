import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getHistoryDays } from '@/server/queries/history';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  if (!from || !to) return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  const days = await getHistoryDays(from, to);
  return NextResponse.json(days);
}
