// src/features/nova/services/NovaKvalitetService/novaKvalitetService.ts
// Beregner og gemmer daglig datakvalitetsscore som snapshot.
// Kaldes af Nova-agenten efter hver nattekørsel.

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type KvalitetSnapshot = {
  dato:       string;
  score:      number;
  total:      number;
  medCvr:     number;
  medTp:      number;
  medKontakt: number;
  medPdf:     number;
  medMonday:  number;
  medLos:     number;
};

function pct(antal: number, total: number) {
  if (total === 0) return 0;
  return Math.round((antal / total) * 100);
}

export function beregnScore(snap: Omit<KvalitetSnapshot, 'dato' | 'score'>): number {
  const { total, medCvr, medTp, medKontakt, medPdf, medMonday, medLos } = snap;
  const vægte = [
    { v: 20, p: pct(medCvr,     total) },
    { v: 20, p: pct(medTp,      total) },
    { v: 15, p: pct(medKontakt, total) },
    { v: 20, p: pct(medPdf,     total) },
    { v: 15, p: pct(medMonday,  total) },
    { v: 10, p: pct(medLos,     total) },
  ];
  return Math.round(vægte.reduce((sum, { v, p }) => sum + (v * p) / 100, 0));
}

export async function gemKvalitetSnapshot(): Promise<KvalitetSnapshot> {
  const supabase = getSupabaseServerClient();

  const [total, medCvr, medTp, medKontakt, medPdf, medMonday, medLos] = await Promise.all([
    supabase.from('stps_rapporter').select('id', { count: 'exact', head: true }),
    supabase.from('stps_rapporter').select('id', { count: 'exact', head: true }).not('cvr', 'is', null),
    supabase.from('stps_rapporter').select('id', { count: 'exact', head: true }).not('tp_tilbudstype', 'is', null),
    supabase.from('stps_rapporter').select('id', { count: 'exact', head: true }).or('tp_telefon.not.is.null,tp_email.not.is.null'),
    supabase.from('stps_rapporter').select('id', { count: 'exact', head: true }).not('pdf_vurdering', 'is', null),
    supabase.from('stps_rapporter').select('id', { count: 'exact', head: true }).not('monday_item_id', 'is', null),
    supabase.from('stps_rapporter').select('id', { count: 'exact', head: true }).not('los_medlem', 'is', null),
  ]);

  const snap = {
    total:      total.count      ?? 0,
    medCvr:     medCvr.count     ?? 0,
    medTp:      medTp.count      ?? 0,
    medKontakt: medKontakt.count ?? 0,
    medPdf:     medPdf.count     ?? 0,
    medMonday:  medMonday.count  ?? 0,
    medLos:     medLos.count     ?? 0,
  };

  const score = beregnScore(snap);
  const dato = new Date().toISOString().slice(0, 10);

  // upsert — kører cron mere end én gang om dagen er det ok
  await supabase.from('nova_kvalitet_snapshot').upsert({
    snapshot_dato: dato,
    score,
    total:      snap.total,
    med_cvr:    snap.medCvr,
    med_tp:     snap.medTp,
    med_kontakt: snap.medKontakt,
    med_pdf:    snap.medPdf,
    med_monday: snap.medMonday,
    med_los:    snap.medLos,
  }, { onConflict: 'snapshot_dato' });

  return { dato, score, ...snap };
}
