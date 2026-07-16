// src/features/dashboard/services/BostedService/bostedService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { BostedDetail, FundItem, StpsFundNiveau, DataKvalitet } from '@/features/dashboard/types/dashboard.types';
import type { SalgsAnbefalinger } from '@/features/dashboard/types/salg.types';

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
  cvr_ansatte: number | null;
  cvr_branche: string | null;
  cvr_virksomhedstype: string | null;
  cvr_stiftet: string | null;
  cvr_opdateret: string | null;
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
  salgs_anbefalinger: unknown | null;
  monday_item_id: string | null;
  monday_gruppe: string | null;
  besoeg_dato: string | null;
  regnskab_aar: number | null;
  regnskab_nettoomsaetning: number | null;
  regnskab_bruttofortjeneste: number | null;
  regnskab_aarsresultat: number | null;
  regnskab_egenkapital: number | null;
  regnskab_balance: number | null;
  regnskab_opdateret: string | null;
  er_gigant: boolean | null;
};

function beregnDataKvalitet(r: DbRapport): DataKvalitet {
  const point = [
    !!r.pdf_vurdering,
    !!r.cvr,
    !!r.tp_tilbudstype,
    !!(r.tp_email || r.tp_telefon),
    !!(r.tp_adresse || r.adresse),
    !!r.tp_website,
    !!(r.tp_pladser || r.pladser),
  ];
  return { score: point.filter(Boolean).length, max: point.length };
}

function mapTilBostedDetail(r: DbRapport): BostedDetail {
  return {
    id: r.id,
    navn: r.stps_tilbud_navn,
    rapportTitel: r.rapport_titel ?? r.stps_tilbud_navn,
    rapportDato: r.rapport_dato,
    besoegDato: r.besoeg_dato,
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
    cvrAnsatte: r.cvr_ansatte,
    cvrBranche: r.cvr_branche,
    cvrVirksomhedstype: r.cvr_virksomhedstype,
    cvrStiftet: r.cvr_stiftet,
    cvrOpdateret: r.cvr_opdateret,
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
    salgsAnbefalinger: (r.salgs_anbefalinger as SalgsAnbefalinger | null) ?? null,
    mondayKunde: r.monday_item_id ? 'kunde' : 'ingen',
    mondayGruppe: r.monday_gruppe ?? null,
    mondayItemId: r.monday_item_id ?? null,
    erGigant: r.er_gigant ?? false,
    cvrAntalAfdelinger: null,
    regnskabAar: r.regnskab_aar ?? null,
    regnskabNettoomsaetning: r.regnskab_nettoomsaetning ?? null,
    regnskabBruttofortjeneste: r.regnskab_bruttofortjeneste ?? null,
    regnskabAarsresultat: r.regnskab_aarsresultat ?? null,
    regnskabEgenkapital: r.regnskab_egenkapital ?? null,
    regnskabBalance: r.regnskab_balance ?? null,
    regnskabOpdateret: r.regnskab_opdateret ?? null,
  };
}

export async function hentBostedById(id: string): Promise<BostedDetail | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_titel, rapport_dato, rapport_url, pdf_url, stps_konklusion, fund_niveau, fokus_omraader, kommune, region, tilsynsform, temaer, scraper_dato, pdf_vurdering, pdf_fund, adresse, pladser, cvr, cvr_ansatte, cvr_branche, cvr_virksomhedstype, cvr_stiftet, cvr_opdateret, pdf_behandlet, tp_tilbudstype, tp_pladser, tp_p_nummer, tp_kommune, tp_kontaktperson, tp_telefon, tp_email, tp_adresse, tp_leder, tp_website, tp_virksomheds_navn, tp_tilsynsmyndighed, tp_pladser_pr_paragraf, fund_items, salgs_anbefalinger, monday_item_id, monday_gruppe, besoeg_dato, regnskab_aar, regnskab_nettoomsaetning, regnskab_bruttofortjeneste, regnskab_aarsresultat, regnskab_egenkapital, regnskab_balance, regnskab_opdateret')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const rapport = data as DbRapport;

  // Tæl antal afdelinger på samme CVR
  let cvrAntalAfdelinger: number | null = null;
  if (rapport.cvr) {
    const { count } = await supabase
      .from('stps_rapporter')
      .select('*', { count: 'exact', head: true })
      .eq('cvr', rapport.cvr);
    cvrAntalAfdelinger = count ?? null;
  }

  // Hent er_gigant separat — kolonnen kan mangle hvis migration ikke er kørt endnu
  let erGigant = false;
  try {
    const { data: gigantData } = await supabase
      .from('stps_rapporter')
      .select('er_gigant')
      .eq('id', id)
      .single();
    erGigant = (gigantData as { er_gigant: boolean } | null)?.er_gigant ?? false;
  } catch {
    // Kolonnen eksisterer ikke endnu — ignorer
  }

  return { ...mapTilBostedDetail(rapport), cvrAntalAfdelinger, erGigant };
}
