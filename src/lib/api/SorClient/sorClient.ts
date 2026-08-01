// src/lib/api/SorClient/sorClient.ts
// Klient til NSI SOR REST API v2 (ingen autentificering krævet)
// Dokumentation: https://services.nsi.dk/api/SOR

const SOR_BASE = 'https://services.nsi.dk/api/SOR/v2/sorentiteter';

export type SorEnhed = {
  sorKode: string;
  navn: string;
  cvr: string | null;
  adresse: string | null;
  postnummer: string | null;
  by: string | null;
  aktiv: boolean;
};

type RåSorEnhed = {
  SorKode?: string | number;
  Navn?: string;
  CvrNummerIdentifikator?: string | number;
  Adresse?: {
    Vejnavn?: string;
    Husnummer?: string;
    Postnummer?: string;
    Postdistrikt?: string;
  };
  Aktiv?: boolean;
  EntityType?: string;
};

type SorResponse = {
  Total?: number;
  SorEnheder?: RåSorEnhed[];
};

function mapSorEnhed(r: RåSorEnhed): SorEnhed {
  const adresseObj = r.Adresse ?? {};
  const vejnavn = adresseObj.Vejnavn ?? '';
  const husnr = adresseObj.Husnummer ?? '';
  const adresse = vejnavn ? `${vejnavn} ${husnr}`.trim() : null;
  const cvr = r.CvrNummerIdentifikator ? String(r.CvrNummerIdentifikator) : null;

  return {
    sorKode: String(r.SorKode ?? ''),
    navn: r.Navn ?? '',
    cvr,
    adresse,
    postnummer: adresseObj.Postnummer ? String(adresseObj.Postnummer) : null,
    by: adresseObj.Postdistrikt ?? null,
    aktiv: r.Aktiv !== false,
  };
}

async function hentSide(sidenummer: number, sideantal = 500): Promise<{ enheder: SorEnhed[]; total: number }> {
  const url = `${SOR_BASE}?Sidenummer=${sidenummer}&Sideantal=${sideantal}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk', Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`SOR API HTTP ${res.status}: ${res.statusText}`);

  const json: SorResponse = await res.json();
  const enheder = (json.SorEnheder ?? []).map(mapSorEnhed);
  return { enheder, total: json.Total ?? 0 };
}

// Henter alle SOR-enheder med paginering
export async function hentAlleSorEnheder(maxSider = 20): Promise<SorEnhed[]> {
  const første = await hentSide(1);
  const alleEnheder: SorEnhed[] = [...første.enheder];
  const antalSider = Math.min(Math.ceil(første.total / 500), maxSider);

  for (let side = 2; side <= antalSider; side++) {
    const { enheder } = await hentSide(side);
    alleEnheder.push(...enheder);
  }

  return alleEnheder.filter((e) => e.aktiv);
}

// Opslag på enkelt CVR-nummer
export async function hentSorVedCvr(cvr: string): Promise<SorEnhed | null> {
  const url = `${SOR_BASE}?CvrNummer=${cvr}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk', Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json: SorResponse = await res.json();
  const enhed = json.SorEnheder?.[0];
  return enhed ? mapSorEnhed(enhed) : null;
}
