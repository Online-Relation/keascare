// src/features/dashboard/services/BostedService/bostedService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { BostedDetail, FundItem, StpsFundNiveau, DataKvalitet } from '@/features/dashboard/types/dashboard.types';

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
  tp_tilbudstype: string | null;
  tp_pladser: string | null;
  tp_p_nummer: string | null;
  tp_kommune: string | null;
  tp_kontaktperson: string | null;
  tp_telefon: string | null;
  tp_email: string | null;
  tp_adresse: string | null;
  tp_leder: string | null;
  tp_website: string | null;
  tp_virksomheds_navn: string | null;
  tp_tilsynsmyndighed: string | null;
  tp_pladser_pr_paragraf: string | null;
  fund_items: FundItem[] | null;
};

function beregnDataKvalitet(r: DbRapport): DataKvalitet {
  const point = [
    !!r.pdf_vurdering,
    !!r.cvr,
    !!r.tp_p_nummer,
    !!r.tp_tilbudstype,
    !!(r.tp_email || r.tp_telefon),
    !!(r.tp_adresse || r.adresse),
    !!r.tp_website,
  ];
  return { score: point.filter(Boolean).length, max: point.length };
}

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
    tpTilbudstype: r.tp_tilbudstype,
    tpPladser: r.tp_pladser,
    tpPNummer: r.tp_p_nummer,
    tpKommune: r.tp_kommune,
    tpKontaktperson: r.tp_kontaktperson,
    tpTelefon: r.tp_telefon,
    tpEmail: r.tp_email,
    tpAdresse: r.tp_adresse,
    tpLeder: r.tp_leder,
    tpWebsite: r.tp_website,
    tpVirksomhedsNavn: r.tp_virksomheds_navn,
    tpTilsynsmyndighed: r.tp_tilsynsmyndighed,
    tpPladsePrParagraf: r.tp_pladser_pr_paragraf,
    dataKvalitet: beregnDataKvalitet(r),
    fundItems: (r.fund_items as FundItem[] | null) ?? null,
  };
}

export async function hentBostedById(id: string): Promise<BostedDetail | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_titel, rapport_dato, rapport_url, pdf_url, stps_konklusion, fund_niveau, fokus_omraader, kommune, region, tilsynsform, temaer, scraper_dato, pdf_vurdering, pdf_fund, adresse, pladser, cvr, pdf_behandlet, tp_tilbudstype, tp_pladser, tp_p_nummer, tp_kommune, tp_kontaktperson, tp_telefon, tp_email, tp_adresse, tp_leder, tp_website, tp_virksomheds_navn, tp_tilsynsmyndighed, tp_pladser_pr_paragraf, fund_items')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapTilBostedDetail(data as DbRapport);
}
