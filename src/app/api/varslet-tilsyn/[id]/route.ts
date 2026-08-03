// src/app/api/varslet-tilsyn/[id]/route.ts

import { NextResponse } from 'next/server';
import { fjernVarsling, opdaterNoter } from '@/features/varsletTilsyn/services/VarsletTilsynService';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await fjernVarsling(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const { noter } = await req.json() as { noter: string };
  await opdaterNoter(id, noter);
  return NextResponse.json({ ok: true });
}
