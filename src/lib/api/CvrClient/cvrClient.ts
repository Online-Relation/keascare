// src/lib/api/CvrClient/cvrClient.ts
// Bruger cvrapi.dk (gratis, ingen nøgle krævet) til grunddata om virksomheder.
// Falder tilbage på Erhvervsstyrelsens API hvis CVR_USER + CVR_PASS er sat som env-vars.

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

async function slaaCvrViaCvrapiDk(cvr: string): Promise<CvrOpslag | null> {
  const res = await fetch(
    `https://cvrapi.dk/api?search=${cvr}&country=dk`,
    {
      headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk' },
      cache: 'no-store',
    }
  );
  if (!res.ok) throw new Error(`cvrapi.dk HTTP ${res.status}: ${res.statusText}`);
  const d = await res.json();
  if (d.error) throw new Error(`cvrapi.dk fejl: ${d.error}`);

  const adresse = d.address ? `${d.address}`.trim() : null;
  const postnr = d.zipcode ? String(d.zipcode) : null;
  const by = d.city ?? null;

  return {
    cvr,
    navn: d.name ?? '',
    adresse: adresse && postnr && by ? `${adresse}, ${postnr} ${by}` : adresse,
    postnummer: postnr,
    by,
    ansatte: typeof d.employees === 'number' ? d.employees : null,
    branche: d.industrytext ?? null,
    virksomhedstype: d.companytype ?? null,
    stiftet: d.startdate ?? null,
  };
}

async function slaaCvrViaVirkDk(cvr: string): Promise<CvrOpslag | null> {
  const user = process.env.CVR_USER;
  const pass = process.env.CVR_PASS;
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');

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

  const res = await fetch('http://distribution.virk.dk/cvr-permanent/virksomhed/_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`distribution.virk.dk HTTP ${res.status}: ${res.statusText}`);

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

export async function slaaCvrOp(cvr: string): Promise<CvrOpslag | null> {
  if (process.env.CVR_USER && process.env.CVR_PASS) {
    return slaaCvrViaVirkDk(cvr);
  }
  return slaaCvrViaCvrapiDk(cvr);
}

export type PNummerOpslag = CvrOpslag & { cvrNummer: string | null };

export async function slaaPNummerOp(pNummer: string): Promise<PNummerOpslag | null> {
  const body = {
    _source: [
      'Vrproduktionsenhed.pNummer',
      'Vrproduktionsenhed.virksomhedMetadata.nyesteNavn.navn',
      'Vrproduktionsenhed.beliggenhedsadresse',
      'Vrproduktionsenhed.virksomhedSummariskRelation.cvrNummer',
    ],
    query: { term: { 'Vrproduktionsenhed.pNummer': parseInt(pNummer, 10) } },
    size: 1,
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.CVR_USER && process.env.CVR_PASS) {
    const auth = Buffer.from(`${process.env.CVR_USER}:${process.env.CVR_PASS}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  const res = await fetch('http://distribution.virk.dk/cvr-permanent/produktionsenhed/_search', {
    method: 'POST',
    headers,
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

  const cvrNummer = hit.virksomhedSummariskRelation?.cvrNummer
    ? String(hit.virksomhedSummariskRelation.cvrNummer)
    : null;

  return {
    cvr: cvrNummer ?? pNummer,
    cvrNummer,
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
