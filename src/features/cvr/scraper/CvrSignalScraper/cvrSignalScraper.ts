// Klar til distribution.virk.dk ElasticSearch API når CVR_USER + CVR_PASS er sat.
// API-dokumentation: https://distribution.virk.dk/cvr-permanent/virksomhed/_search
//
// Forespørgslen søger efter virksomheder der:
//   - Har branchekode 87901 eller 87902
//   - Er startet inden for de seneste X dage
//   - Er aktive (ikke ophørt)

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { BOSTED_BRANCHEKODER } from '@/features/cvr/types/cvr.types';

export type CvrSignalScraperResultat = {
  fundet: number;
  nye: number;
  springetOver: string;
};

// TODO: Erstat denne stub med rigtig API-kald når CVR_USER + CVR_PASS er tilgængelige.
// Se kommentar øverst i filen for API-detaljer.
async function hentNyeBostederFraCvr(_dage: number): Promise<RåCvrVirksomhed[]> {
  const user = process.env.CVR_USER;
  const pass = process.env.CVR_PASS;

  if (!user || !pass) {
    throw new Error('CVR_USER og CVR_PASS er ikke sat — kan ikke hente fra distribution.virk.dk');
  }

  const fraDato = new Date();
  fraDato.setDate(fraDato.getDate() - _dage);
  const fraDatoStr = fraDato.toISOString().substring(0, 10);

  const query = {
    size: 100,
    query: {
      bool: {
        must: [
          { terms: { 'virksomhedMetadata.nyesteHovedbranche.branchekode': Object.keys(BOSTED_BRANCHEKODER) } },
          { range: { 'virksomhedMetadata.stiftelsesDato': { gte: fraDatoStr } } },
          { term: { 'virksomhedMetadata.sammensatStatus': 'NORMAL' } },
        ],
      },
    },
    _source: [
      'cvrNummer',
      'virksomhedMetadata.nyesteNavn.navn',
      'virksomhedMetadata.nyesteHovedbranche.branchekode',
      'virksomhedMetadata.nyesteHovedbranche.branchetekst',
      'virksomhedMetadata.stiftelsesDato',
      'virksomhedMetadata.nyesteBeliggenhedsadresse',
    ],
  };

  const res = await fetch('http://distribution.virk.dk/cvr-permanent/virksomhed/_search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
    },
    body: JSON.stringify(query),
  });

  if (!res.ok) throw new Error(`CVR API fejl: ${res.status} ${res.statusText}`);

  const data = await res.json() as { hits: { hits: { _source: RåCvrVirksomhed }[] } };
  return data.hits.hits.map((h) => h._source);
}

type RåCvrVirksomhed = {
  cvrNummer: number;
  virksomhedMetadata: {
    nyesteNavn: { navn: string };
    nyesteHovedbranche: { branchekode: string; branchetekst: string };
    stiftelsesDato: string | null;
    nyesteBeliggenhedsadresse: {
      vejnavn: string | null;
      husnummerFra: number | null;
      postnummer: number | null;
      postdistrikt: string | null;
      kommune: { kommuneNavn: string | null } | null;
    } | null;
  };
};

function mapAdresse(rå: RåCvrVirksomhed['virksomhedMetadata']['nyesteBeliggenhedsadresse']): string | null {
  if (!rå) return null;
  const dele = [
    rå.vejnavn && rå.husnummerFra ? `${rå.vejnavn} ${rå.husnummerFra}` : rå.vejnavn,
    rå.postnummer && rå.postdistrikt ? `${rå.postnummer} ${rå.postdistrikt}` : null,
  ].filter(Boolean);
  return dele.join(', ') || null;
}

export async function kørCvrSignalScraper(dage = 30): Promise<CvrSignalScraperResultat> {
  const virksomheder = await hentNyeBostederFraCvr(dage);
  const supabase = getSupabaseServerClient();
  let nye = 0;

  for (const v of virksomheder) {
    const cvr = String(v.cvrNummer);
    const meta = v.virksomhedMetadata;
    const branchekode = meta.nyesteHovedbranche.branchekode;

    const { data: eksisterende } = await supabase
      .from('cvr_signaler')
      .select('id')
      .eq('cvr', cvr)
      .maybeSingle();

    if (eksisterende) continue;

    const { error } = await supabase.from('cvr_signaler').insert({
      cvr,
      navn:        meta.nyesteNavn.navn,
      kommune:     meta.nyesteBeliggenhedsadresse?.kommune?.kommuneNavn ?? null,
      adresse:     mapAdresse(meta.nyesteBeliggenhedsadresse),
      branchekode,
      branchetekst: BOSTED_BRANCHEKODER[branchekode] ?? meta.nyesteHovedbranche.branchetekst,
      startdato:   meta.stiftelsesDato ?? null,
      opdaget_dato: new Date().toISOString(),
    });

    if (!error) nye++;
  }

  return { fundet: virksomheder.length, nye, springetOver: `${virksomheder.length - nye} allerede kendte` };
}
