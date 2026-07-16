import { NextRequest, NextResponse } from 'next/server';
import { opdaterReviewStatus } from '@/features/regelovervagning/services/RegulatoryItemService';
import type { ReviewStatus } from '@/features/regelovervagning/types/regulatory.types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { status?: ReviewStatus; note?: string };
  if (!body.status) return NextResponse.json({ ok: false, fejl: 'status mangler' }, { status: 400 });
  await opdaterReviewStatus(id, body.status, body.note);
  return NextResponse.json({ ok: true });
}
