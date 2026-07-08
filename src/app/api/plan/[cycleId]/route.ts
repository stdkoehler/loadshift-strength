import { NextResponse } from 'next/server';
import { getFullPlan } from '@/server/queries/plan';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const plan = await getFullPlan(Number(cycleId));
  if (!plan) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(plan);
}
