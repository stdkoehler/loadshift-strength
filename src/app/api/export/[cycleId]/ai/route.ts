import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildAiExport } from '@/server/queries/ai-export';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const from = request.nextUrl.searchParams.get('from') || undefined;
  const to = request.nextUrl.searchParams.get('to') || undefined;
  const data = await buildAiExport(Number(cycleId), from, to);
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data);
}
