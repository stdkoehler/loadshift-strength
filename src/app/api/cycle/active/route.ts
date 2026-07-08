import { NextResponse } from 'next/server';
import { getActiveCycle } from '@/server/queries/cycles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const cycle = await getActiveCycle();
  return NextResponse.json(cycle);
}
