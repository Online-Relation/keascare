// src/app/dashboard/nova/page.tsx

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { NovaPage } from '@/features/nova/components/NovaPage';

export default async function NovaSidePage() {
  const supabase = getSupabaseServerClient();

  // Hent de seneste 30 natsrapporter til arbejdsloggen
  const { data: natsrapporter } = await supabase
    .from('nova_natsrapport')
    .select('udfort_dato, cvr_beriget, tp_beriget, tp_requeued, los_matchet, monday_matchet, total_fejl')
    .order('udfort_dato', { ascending: false })
    .limit(30);

  // Hent kvalitetsscore-snapshots til kurven (seneste 90 dage)
  const { data: kvalitetSnapshots } = await supabase
    .from('nova_kvalitet_snapshot')
    .select('snapshot_dato, score')
    .order('snapshot_dato', { ascending: false })
    .limit(90);

  // Hent datakvalitet — beregnet på tværs af stps_rapporter
  const { count: totalBosteder } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true });

  const { count: medCvr } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .not('cvr', 'is', null);

  const { count: medTp } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .not('tp_tilbudstype', 'is', null);

  const { count: medKontakt } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .or('tp_telefon.not.is.null,tp_email.not.is.null');

  const { count: medPdf } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .not('pdf_vurdering', 'is', null);

  const { count: medMonday } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .not('monday_item_id', 'is', null);

  const { count: medLos } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .not('los_medlem', 'is', null);

  const total = totalBosteder ?? 0;

  const datakvalitet = {
    total,
    medCvr:      medCvr      ?? 0,
    medTp:       medTp       ?? 0,
    medKontakt:  medKontakt  ?? 0,
    medPdf:      medPdf      ?? 0,
    medMonday:   medMonday   ?? 0,
    medLos:      medLos      ?? 0,
  };

  return (
    <NovaPage
      natsrapporter={(natsrapporter ?? []) as NatsrapportRad[]}
      datakvalitet={datakvalitet}
      kvalitetSnapshots={(kvalitetSnapshots ?? []) as KvalitetSnapshotRad[]}
    />
  );
}

export type KvalitetSnapshotRad = {
  snapshot_dato: string;
  score:         number;
};

export type NatsrapportRad = {
  udfort_dato:    string;
  cvr_beriget:    number | null;
  tp_beriget:     number | null;
  tp_requeued:    number | null;
  los_matchet:    number | null;
  monday_matchet: number | null;
  total_fejl:     number | null;
};
