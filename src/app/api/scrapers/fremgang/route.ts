// src/app/api/scrapers/fremgang/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type FremgangItem = {
  id: string;
  label: string;
  beskrivelse: string;
  nuværende: number;
  mål: number;
  pct: number;
  scraperId: string;
};

async function count(supabase: ReturnType<typeof getSupabaseServerClient>, filter: string): Promise<number> {
  const { count: c } = await supabase
    .from('stps_rapporter')
    .select('*', { count: 'exact', head: true })
    .not(filter, 'is', null);
  return c ?? 0;
}

export async function GET() {
  const supabase = getSupabaseServerClient();

  const [total, pdfOk, pnrOk, cvrOk, tpOk, fundOk] = await Promise.all([
    supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).then(r => r.count ?? 0),
    count(supabase, 'pdf_vurdering'),
    count(supabase, 'p_nummer'),
    count(supabase, 'cvr'),
    count(supabase, 'tp_tilbudstype'),
    count(supabase, 'fund_items'),
  ]);

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const items: FremgangItem[] = [
    {
      id: 'pdf',
      label: 'PDF parsede',
      beskrivelse: 'Tilsynsrapporter med udtrukket vurdering og fund',
      nuværende: pdfOk,
      mål: total,
      pct: pct(pdfOk),
      scraperId: 'stps-detaljer',
    },
    {
      id: 'fund-items',
      label: 'Strukturerede fund-items',
      beskrivelse: 'Rapporter med alle målepunkter udtrukket som data',
      nuværende: fundOk,
      mål: total,
      pct: pct(fundOk),
      scraperId: 'stps-fund-items',
    },
    {
      id: 'cvr',
      label: 'CVR-berigede',
      beskrivelse: 'Bosteder matchet med CVR-registret via P-nummer',
      nuværende: cvrOk,
      mål: total,
      pct: pct(cvrOk),
      scraperId: 'cvr-berig',
    },
    {
      id: 'tp-match',
      label: 'Tilbudsportalen-matchet',
      beskrivelse: 'STPS-rapporter koblet til Tilbudsportalen-data',
      nuværende: tpOk,
      mål: total,
      pct: pct(tpOk),
      scraperId: 'tp-detaljer',
    },
    {
      id: 'pnummer',
      label: 'P-numre udtrukket',
      beskrivelse: 'Rapporter med P-nummer fundet i PDF (ikke alle PDFer indeholder det)',
      nuværende: pnrOk,
      mål: total,
      pct: pct(pnrOk),
      scraperId: 'stps-pnummer',
    },
  ];

  return NextResponse.json({ total, items });
}
