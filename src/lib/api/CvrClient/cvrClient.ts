// src/lib/api/CvrClient/cvrClient.ts
// Bruger Erhvervsstyrelsens officielle gratis CVR ElasticSearch API (http://distribution.virk.dk)
// til grunddata. Kræver ingen API-nøgle.

export type CvrOpslag = {
  cvr: string;
  navn: string;
  adresse: string | null;
  postnummer: string | null;
  by: string | null;
  ansatte: number | null;
  branche: string | null;
  virksomhedstype: string | null;
  stiftet: string | null;
};

const ERST_URL = 'http://distribution.virk.dk/cvr-permanent/virksomhed/_search';

export async function slaaCvrOp(cvr: string): Promise<CvrOpslag | null> {
  const body = {
    _source: [
      'Vrvirksomhed.cvrNummer',
      'Vrvirksomhed.virksomhedMetadata.nyesteNavn.navn',
      'Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse',
      'Vrvirksomhed.virksomhedMetadata.nyesteAarsbeskaeftigelse.antalAnsatte',
      'Vrvirksomhed.virksomhedMetadata.nyesteHovedbranche.branchetekst',
      'Vrvirksomhed.virksomhedMetadata.nyesteVirksomhedsform.kortBeskrivelse',
      'Vrvirksomhed.livsforloeb',
    ],
    query: { term: { 'Vrvirksomhed.cvrNummer': parseInt(cvr, 10) } },
    size: 1,
  };

  const res = await fetch(ERST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const json = await res.json();
  const hit = json?.hits?.hits?.[0]?._source?.Vrvirksomhed;
  if (!hit) return null;

  const meta = hit.virksomhedMetadata ?? {};
  const adresseObj = meta.nyesteBeliggenhedsadresse ?? {};
  const vejnavn = adresseObj.vejnavn ?? '';
  const husnr = adresseObj.husnummerFra ?? '';
  const postnr = adresseObj.postnummer ? String(adresseObj.postnummer) : null;
  const by = adresseObj.postdistrikt ?? null;
  const adresse = vejnavn ? `${vejnavn} ${husnr}`.trim() : null;

  const ansatte = meta.nyesteAarsbeskaeftigelse?.antalAnsatte ?? null;
  const branche = meta.nyesteHovedbranche?.branchetekst ?? null;
  const virksomhedstype = meta.nyesteVirksomhedsform?.kortBeskrivelse ?? null;

  const startDato = hit.livsforloeb?.[0]?.periode?.gyldigFra ?? null;

  return {
    cvr,
    navn: meta.nyesteNavn?.navn ?? '',
    adresse: adresse && postnr && by ? `${adresse}, ${postnr} ${by}` : adresse,
    postnummer: postnr,
    by,
    ansatte: typeof ansatte === 'number' ? ansatte : null,
    branche,
    virksomhedstype,
    stiftet: startDato,
  };
}

export async function slaaPNummerOp(pNummer: string): Promise<CvrOpslag | null> {
  const body = {
    _source: [
      'Vrproduktionsenhed.pNummer',
      'Vrproduktionsenhed.virksomhedMetadata.nyesteNavn.navn',
      'Vrproduktionsenhed.beliggenhedsadresse',
    ],
    query: { term: { 'Vrproduktionsenhed.pNummer': parseInt(pNummer, 10) } },
    size: 1,
  };

  const res = await fetch('http://distribution.virk.dk/cvr-permanent/produktionsenhed/_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const json = await res.json();
  const hit = json?.hits?.hits?.[0]?._source?.Vrproduktionsenhed;
  if (!hit) return null;

  const adresseObj = hit.beliggenhedsadresse?.[0] ?? {};
  const vejnavn = adresseObj.vejnavn ?? '';
  const husnr = adresseObj.husnummerFra ?? '';
  const postnr = adresseObj.postnummer ? String(adresseObj.postnummer) : null;
  const by = adresseObj.postdistrikt ?? null;
  const adresse = vejnavn ? `${vejnavn} ${husnr}`.trim() : null;

  return {
    cvr: String(hit.pNummer ?? pNummer),
    navn: hit.virksomhedMetadata?.nyesteNavn?.navn ?? '',
    adresse: adresse && postnr && by ? `${adresse}, ${postnr} ${by}` : adresse,
    postnummer: postnr,
    by,
    ansatte: null,
    branche: null,
    virksomhedstype: null,
    stiftet: null,
  };
}
