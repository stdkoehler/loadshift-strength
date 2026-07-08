import { NextResponse } from 'next/server';
import { listTemplates } from '@/server/queries/cycles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const templates = await listTemplates();
  return NextResponse.json(templates);
}
