#!/usr/bin/env node
// scripts/sor-sync.js
// Kør fra Synology (dansk IP) — henter SOR FHIR og upsert til Supabase
// Krav: node 18+
// Opsætning: sæt miljøvariable SUPABASE_URL og SUPABASE_SERVICE_KEY
// Cron eksempel: 0 3 * * 1 node /volume1/scripts/sor-sync.js >> /volume1/logs/sor.log 2>&1

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Mangler SUPABASE_URL og/eller SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const FHIR_BASE = 'https://sor-fhir.sundhedsdatastyrelsen.dk/fhir/Organization';
const CVR_SYSTEMER = [
  'urn:oid:1.2.208.176.1.2',
  'https://www.cvr.dk/',
  'urn:dk:cvr',
  'http://cvr.dk',
];

function findCvr(identifiers = []) {
  for (const sys of CVR_SYSTEMER) {
    const m = identifiers.find((id) => id.system === sys);
    if (m?.value) return m.value;
  }
  const fallback = identifiers.find((id) => /^\d{8}$/.test(id.value ?? ''));
  return fallback?.value ?? null;
}

function findSorKode(identifiers = [], fallbackId) {
  const m = identifiers.find((id) => id.system === 'urn:oid:1.2.208.176.1.1');
  return m?.value ?? fallbackId ?? '';
}

function mapOrg(org) {
  const ids = org.identifier ?? [];
  const adr = org.address?.[0];
  return {
    sor_kode: findSorKode(ids, org.id),
    navn: org.name ?? '',
    cvr: findCvr(ids),
    adresse: adr?.line?.[0] ?? null,
    postnummer: adr?.postalCode ?? null,
    by: adr?.city ?? null,
    aktiv: org.active !== false,
    synkroniseret: new Date().toISOString(),
  };
}

async function hentAlleSorEnheder() {
  const enheder = [];
  let url = `${FHIR_BASE}?_count=500&active=true&_format=json`;
  let side = 0;

  while (url && side < 60) {
    console.log(`Henter side ${side + 1}: ${url}`);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk', Accept: 'application/fhir+json' },
    });
    if (!res.ok) throw new Error(`FHIR HTTP ${res.status}: ${res.statusText}`);

    const bundle = await res.json();
    const orgs = (bundle.entry ?? [])
      .map((e) => e.resource)
      .filter((r) => r?.resourceType === 'Organization')
      .map(mapOrg)
      .filter((e) => e.sor_kode);

    enheder.push(...orgs);
    const næste = bundle.link?.find((l) => l.relation === 'next');
    url = næste?.url ?? null;
    side++;
  }

  return enheder;
}

async function upsertTilSupabase(rækker) {
  const BATCH = 500;
  let total = 0;
  for (let i = 0; i < rækker.length; i += BATCH) {
    const batch = rækker.slice(i, i + BATCH);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sor_bosteder_cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const tekst = await res.text();
      throw new Error(`Supabase upsert fejl: ${res.status} ${tekst}`);
    }
    total += batch.length;
    console.log(`Upsert ${total}/${rækker.length}...`);
  }
}

async function kørRpc(funktion) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${funktion}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: '{}',
  });
  if (!res.ok) return { fejl: await res.text() };
  const data = await res.json();
  return { opdaterede: data };
}

async function main() {
  console.log(`[${new Date().toISOString()}] SOR sync starter`);

  const enheder = await hentAlleSorEnheder();
  console.log(`Hentet ${enheder.length} SOR-enheder`);

  await upsertTilSupabase(enheder);
  console.log('Cache opdateret');

  const stps = await kørRpc('match_sor_paa_stps');
  const tp = await kørRpc('match_sor_paa_tp');
  console.log(`CVR-match: stps=${JSON.stringify(stps)}, tp=${JSON.stringify(tp)}`);

  console.log(`[${new Date().toISOString()}] SOR sync færdig`);
}

main().catch((err) => {
  console.error('SOR sync fejl:', err.message);
  process.exit(1);
});
