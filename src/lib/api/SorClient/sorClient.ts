// src/lib/api/SorClient/sorClient.ts
// Bruger Sundhedsdatastyrelsens FHIR SOR endpoint (offentligt, ingen auth)
// FHIR docs: https://sor-fhir.sundhedsdatastyrelsen.dk/fhir/

export type SorEnhed = {
  sorKode: string;
  navn: string;
  cvr: string | null;
  adresse: string | null;
  postnummer: string | null;
  by: string | null;
  aktiv: boolean;
};

// FHIR response types
type FhirIdentifier = { system?: string; value?: string };
type FhirAddress = { line?: string[]; postalCode?: string; city?: string };
type FhirOrg = {
  resourceType: string;
  id?: string;
  identifier?: FhirIdentifier[];
  name?: string;
  active?: boolean;
  address?: FhirAddress[];
};
type FhirEntry = { resource?: FhirOrg };
type FhirBundle = {
  resourceType: string;
  total?: number;
  link?: { relation: string; url: string }[];
  entry?: FhirEntry[];
};

const FHIR_BASE = 'https://sor-fhir.sundhedsdatastyrelsen.dk/fhir/Organization';
const FHIR_SIDE_STØRRELSE = 500;

const HEADERS = {
  'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk',
  Accept: 'application/fhir+json',
};

// CVR identifier systems brugt i dansk FHIR
const CVR_SYSTEMER = [
  'urn:oid:1.2.208.176.1.2',
  'https://www.cvr.dk/',
  'urn:dk:cvr',
  'http://cvr.dk',
];

function findCvr(identifiers: FhirIdentifier[] = []): string | null {
  for (const sys of CVR_SYSTEMER) {
    const match = identifiers.find((id) => id.system === sys);
    if (match?.value) return match.value;
  }
  // Fallback: 8-cifret identifier der ligner CVR
  const fallback = identifiers.find((id) => /^\d{8}$/.test(id.value ?? ''));
  return fallback?.value ?? null;
}

function findSorKode(identifiers: FhirIdentifier[], fallbackId?: string): string {
  const sorSystem = 'urn:oid:1.2.208.176.1.1';
  const match = identifiers.find((id) => id.system === sorSystem);
  return match?.value ?? fallbackId ?? '';
}

function mapFhirOrg(org: FhirOrg): SorEnhed {
  const identifiers = org.identifier ?? [];
  const adresseObj = org.address?.[0];
  const linje = adresseObj?.line?.[0] ?? null;

  return {
    sorKode: findSorKode(identifiers, org.id),
    navn: org.name ?? '',
    cvr: findCvr(identifiers),
    adresse: linje,
    postnummer: adresseObj?.postalCode ?? null,
    by: adresseObj?.city ?? null,
    aktiv: org.active !== false,
  };
}

async function hentFhirSide(url: string): Promise<{ enheder: SorEnhed[]; næsteUrl: string | null }> {
  const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`SOR FHIR HTTP ${res.status}: ${res.statusText} [URL: ${url}]`);

  const bundle: FhirBundle = await res.json();
  if (bundle.resourceType !== 'Bundle') {
    throw new Error(`Uventet svar fra SOR FHIR — resourceType: ${bundle.resourceType}`);
  }

  const enheder = (bundle.entry ?? [])
    .map((e) => e.resource)
    .filter((r): r is FhirOrg => r?.resourceType === 'Organization')
    .map(mapFhirOrg);

  const næsteLink = bundle.link?.find((l) => l.relation === 'next');
  return { enheder, næsteUrl: næsteLink?.url ?? null };
}

// Henter alle aktive SOR-organisationer med FHIR-paginering
export async function hentAlleSorEnheder(maxSider = 50): Promise<SorEnhed[]> {
  const startUrl = `${FHIR_BASE}?_count=${FHIR_SIDE_STØRRELSE}&active=true&_format=json`;
  const alleEnheder: SorEnhed[] = [];
  let næsteUrl: string | null = startUrl;
  let side = 0;

  while (næsteUrl && side < maxSider) {
    const { enheder, næsteUrl: nyUrl } = await hentFhirSide(næsteUrl);
    alleEnheder.push(...enheder);
    næsteUrl = nyUrl;
    side++;
  }

  return alleEnheder.filter((e) => e.aktiv);
}

// Opslag på enkelt CVR-nummer
export async function hentSorVedCvr(cvr: string): Promise<SorEnhed | null> {
  const url = `${FHIR_BASE}?identifier=${encodeURIComponent(cvr)}&_format=json`;
  try {
    const { enheder } = await hentFhirSide(url);
    return enheder[0] ?? null;
  } catch {
    return null;
  }
}
