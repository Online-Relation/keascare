// src/lib/api/SorClient/sorClient.ts
// Klient til NSI SOR REST API v2 (ingen autentificering krævet)
// Dokumentation: https://services.nsi.dk/api/SOR

// NSI SOR REST API v2 — offentligt tilgængelig uden auth
// Dokumentation: https://services.nsi.dk/swagger/index.html?urls.primaryName=SOR
const SOR_BASE = 'https://services.nsi.dk/api/SOR/v2/sorentiteter';

// Fallback-URL'er forsøges i rækkefølge hvis primær URL fejler
const SOR_FALLBACKS = [
  'https://services.nsi.dk/api/sor/v2/sorentiteter',
  'https://services.nsi.dk/api/SOR/v1/sorentiteter',
];

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

async function hentSide(sidenummer: number, sideantal = 500, baseUrl = SOR_BASE): Promise<{ enheder: SorEnhed[]; total: number }> {
  const url = `${baseUrl}?Sidenummer=${sidenummer}&Sideantal=${sideantal}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk', Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`SOR API HTTP ${res.status}: ${res.statusText} [URL: ${url}]`);

  const json: SorResponse = await res.json();
  const enheder = (json.SorEnheder ?? []).map(mapSorEnhed);
  return { enheder, total: json.Total ?? 0 };
}

async function findArbejdendeBase(): Promise<string> {
  const kandidater = [SOR_BASE, ...SOR_FALLBACKS];
  for (const base of kandidater) {
    try {
      const testUrl = `${base}?Sidenummer=1&Sideantal=1`;
      const res = await fetch(testUrl, {
        headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk', Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) return base;
    } catch { /* prøv næste */ }
  }
  throw new Error(`SOR API ikke tilgængeligt. Prøvede: ${kandidater.join(', ')}`);
}

// Henter alle SOR-enheder med paginering — finder automatisk fungerende base-URL
export async function hentAlleSorEnheder(maxSider = 20): Promise<SorEnhed[]> {
  const base = await findArbejdendeBase();
  const første = await hentSide(1, 500, base);
  const alleEnheder: SorEnhed[] = [...første.enheder];
  const antalSider = Math.min(Math.ceil(første.total / 500), maxSider);

  for (let side = 2; side <= antalSider; side++) {
    const { enheder } = await hentSide(side, 500, base);
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
