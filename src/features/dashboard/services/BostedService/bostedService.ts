// src/features/dashboard/services/BostedService/bostedService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { BostedDetail, StpsFundNiveau } from '@/features/dashboard/types/dashboard.types';

type DbRapport = {
  id: string;
  stps_tilbud_navn: string;
  rapport_titel: string | null;
  rapport_dato: string | null;
  rapport_url: string;
  pdf_url: string | null;
  stps_konklusion: string | null;
  fund_niveau: string | null;
  fokus_omraader: string[] | null;
  kommune: string | null;
  region: string | null;
  tilsynsform: string | null;
  temaer: string[] | null;
  scraper_dato: string | null;
  pdf_vurdering: string | null;
  pdf_fund: string | null;
  adresse: string | null;
  pladser: string | null;
  cvr: string | null;
  pdf_behandlet: boolean | null;
};

function mapTilBostedDetail(r: DbRapport): BostedDetail {
  return {
    id: r.id,
    navn: r.stps_tilbud_navn,
    rapportTitel: r.rapport_titel ?? r.stps_tilbud_navn,
    rapportDato: r.rapport_dato,
    rapportUrl: r.rapport_url,
    pdfUrl: r.pdf_url,
    stpsKonklusion: r.stps_konklusion,
    fundNiveau: (r.fund_niveau as StpsFundNiveau) ?? 'ukendt',
    fokusOmraader: r.fokus_omraader ?? [],
    kommune: r.kommune,
    region: r.region,
    tilsynsform: r.tilsynsform,
    temaer: r.temaer ?? [],
    scraperDato: r.scraper_dato,
    pdfVurdering: r.pdf_vurdering,
    pdfFund: r.pdf_fund,
    adresse: r.adresse,
    pladser: r.pladser,
    cvr: r.cvr,
    pdfBehandlet: r.pdf_behandlet ?? false,
  };
}

export async function hentBostedById(id: string): Promise<BostedDetail | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_titel, rapport_dato, rapport_url, pdf_url, stps_konklusion, fund_niveau, fokus_omraader, kommune, region, tilsynsform, temaer, scraper_dato, pdf_vurdering, pdf_fund, adresse, pladser, cvr, pdf_behandlet')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapTilBostedDetail(data as DbRapport);
}
