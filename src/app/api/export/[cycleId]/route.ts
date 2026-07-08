import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { exportCycle } from '@/server/queries/export-import';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const includeLogs = request.nextUrl.searchParams.get('logs') === '1';
  const data = await exportCycle(Number(cycleId), includeLogs);
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data);
}
