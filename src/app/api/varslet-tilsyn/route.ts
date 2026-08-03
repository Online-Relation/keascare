// src/app/api/varslet-tilsyn/route.ts

import { NextResponse } from 'next/server';
import { hentAlleVarslinger, opretVarsling } from '@/features/varsletTilsyn/services/VarsletTilsynService';

export async function GET() {
  const varslinger = await hentAlleVarslinger();
  return NextResponse.json(varslinger);
}

export async function POST(req: Request) {
  const body = await req.json() as {
    bostedId: string;
    bostedNavn: string;
    kommune?: string | null;
    senesteRapportDato?: string | null;
    oprettetAf?: string | null;
  };

  if (!body.bostedId || !body.bostedNavn) {
    return NextResponse.json({ error: 'bostedId og bostedNavn er påkrævet' }, { status: 400 });
  }

  const varsling = await opretVarsling(
    body.bostedId,
    body.bostedNavn,
    body.kommune ?? null,
    body.senesteRapportDato ?? null,
    body.oprettetAf ?? null,
  );

  return NextResponse.json(varsling, { status: 201 });
}
