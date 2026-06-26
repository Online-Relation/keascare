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
  deltaSidsteDøgn: number | null;
};

type Snapshot = {
  pdf: number;
  fund: number;
  cvr: number;
  tp: number;
  pnr: number;
  total: number;
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

  // Hent aktuelle tal parallelt
  const [total, pdfOk, pnrOk, cvrOk, tpOk, fundOk] = await Promise.all([
    supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).then(r => r.count ?? 0),
    count(supabase, 'pdf_vurdering'),
    count(supabase, 'p_nummer'),
    count(supabase, 'cvr'),
    count(supabase, 'tp_tilbudstype'),
    count(supabase, 'fund_items'),
  ]);

  // Daglig snapshot-logik — sammenlign med gårsdagens snapshot
  const midnatIdag = new Date();
  midnatIdag.setHours(0, 0, 0, 0);
  const midnatIgår = new Date(midnatIdag);
  midnatIgår.setDate(midnatIgår.getDate() - 1);

  // Hent gårsdagens snapshot (gemmes under scraper_id = 'fremgang-snapshot')
  const { data: gårRows } = await supabase
    .from('scraper_logs')
    .select('resultat')
    .eq('scraper_id', 'fremgang-snapshot')
    .gte('kørt_kl', midnatIgår.toISOString())
    .lt('kørt_kl', midnatIdag.toISOString())
    .order('kørt_kl', { ascending: false })
    .limit(1);

  const gårSnapshot = (gårRows?.[0]?.resultat ?? null) as Snapshot | null;

  // Gem dagens snapshot hvis der ikke allerede er et
  const { data: idagRows } = await supabase
    .from('scraper_logs')
    .select('id')
    .eq('scraper_id', 'fremgang-snapshot')
    .gte('kørt_kl', midnatIdag.toISOString())
    .limit(1);

  if (!idagRows?.length) {
    await supabase.from('scraper_logs').insert({
      scraper_id: 'fremgang-snapshot',
      ok: true,
      resultat: { pdf: pdfOk, fund: fundOk, cvr: cvrOk, tp: tpOk, pnr: pnrOk, total },
    });
  }

  const delta = (key: keyof Snapshot, nuværende: number): number | null => {
    if (!gårSnapshot) return null;
    const diff = nuværende - gårSnapshot[key];
    return diff;
  };

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
      deltaSidsteDøgn: delta('pdf', pdfOk),
    },
    {
      id: 'fund-items',
      label: 'Strukturerede fund-items',
      beskrivelse: 'Rapporter med alle målepunkter udtrukket som data',
      nuværende: fundOk,
      mål: total,
      pct: pct(fundOk),
      scraperId: 'stps-fund-items',
      deltaSidsteDøgn: delta('fund', fundOk),
    },
    {
      id: 'cvr',
      label: 'CVR-berigede',
      beskrivelse: 'Bosteder matchet med CVR-registret via P-nummer',
      nuværende: cvrOk,
      mål: total,
      pct: pct(cvrOk),
      scraperId: 'cvr-berig',
      deltaSidsteDøgn: delta('cvr', cvrOk),
    },
    {
      id: 'tp-match',
      label: 'Tilbudsportalen-matchet',
      beskrivelse: 'STPS-rapporter koblet til Tilbudsportalen-data',
      nuværende: tpOk,
      mål: total,
      pct: pct(tpOk),
      scraperId: 'tp-detaljer',
      deltaSidsteDøgn: delta('tp', tpOk),
    },
    {
      id: 'pnummer',
      label: 'P-numre udtrukket',
      beskrivelse: 'Rapporter med P-nummer fundet i PDF (ikke alle PDFer indeholder det)',
      nuværende: pnrOk,
      mål: total,
      pct: pct(pnrOk),
      scraperId: 'stps-pnummer',
      deltaSidsteDøgn: delta('pnr', pnrOk),
    },
  ];

  return NextResponse.json({ total, items });
}
