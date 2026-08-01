#!/usr/bin/env node
// scripts/sor-sync.js
// Kør fra Synology — henter SOR FHIR og upsert til Supabase
// Krav: node 18+
// Cron eksempel: 0 3 * * 1 /volume1/@appstore/Node.js_v18/usr/local/bin/node /volume1/scripts/sor-sync.js

const https = require('https');
const http  = require('http');

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

// Simpel https GET der returnerer parsed JSON
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.get(
      { hostname: parsedUrl.hostname, path: parsedUrl.pathname + parsedUrl.search, headers, rejectUnauthorized: false },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode} fra ${url}`));
          } else {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error(`Ugyldig JSON fra ${url}: ${data.slice(0, 200)}`)); }
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

// Simpel https POST
function httpsPost(url, headers = {}, body = '') {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const bodyBuf = Buffer.from(body);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.request(
      {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: { ...headers, 'Content-Length': bodyBuf.length },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
          } else {
            try { resolve(data ? JSON.parse(data) : null); }
            catch { resolve(null); }
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(bodyBuf);
    req.end();
  });
}

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
  const hdrs = { 'User-Agent': 'KeasCare/1.0', Accept: 'application/fhir+json' };

  while (url && side < 60) {
    console.log(`Henter side ${side + 1}...`);
    const bundle = await httpsGet(url, hdrs);
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
  const hdrs = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'resolution=merge-duplicates',
  };
  for (let i = 0; i < rækker.length; i += BATCH) {
    const batch = rækker.slice(i, i + BATCH);
    await httpsPost(`${SUPABASE_URL}/rest/v1/sor_bosteder_cache`, hdrs, JSON.stringify(batch));
    total += batch.length;
    console.log(`Upsert ${total}/${rækker.length}`);
  }
}

async function kørRpc(funktion) {
  const hdrs = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };
  try {
    const data = await httpsPost(`${SUPABASE_URL}/rest/v1/rpc/${funktion}`, hdrs, '{}');
    return { opdaterede: data };
  } catch (e) {
    return { fejl: e.message };
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] SOR sync starter`);
  const enheder = await hentAlleSorEnheder();
  console.log(`Hentet ${enheder.length} SOR-enheder`);
  await upsertTilSupabase(enheder);
  console.log('Cache opdateret');
  const stps = await kørRpc('match_sor_paa_stps');
  const tp   = await kørRpc('match_sor_paa_tp');
  console.log(`CVR-match: stps=${JSON.stringify(stps)}, tp=${JSON.stringify(tp)}`);
  console.log(`[${new Date().toISOString()}] SOR sync færdig`);
}

main().catch((err) => {
  console.error('SOR sync fejl:', err.message);
  process.exit(1);
});
