#!/usr/bin/env node
// scripts/sor-sync.js
// Henter SOR2 CSV-data fra Sundhedsdatastyrelsens offentlige filserver
// og upsert til Supabase. Kør fra Synology (dansk IP).
// Krav: node 18+
// Cron: 0 3 * * 1 /volume1/@appstore/Node.js_v18/usr/local/bin/node /volume1/scripts/sor-sync.js

const https = require('https');
const http  = require('http');
const zlib  = require('zlib');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Mangler SUPABASE_URL og/eller SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// SOR2 CSV-filer fra Sundhedsdatastyrelsen — offentligt tilgængeligt over HTTP
// Kilde: Vejledning i systemanvendelse af SOR-data (SDST, 2023)
// Struktur: /sor2_produktion/V1_00/data/
const SOR_BASE = 'https://sor-filer.sundhedsdata.dk/sor2_produktion/V1_00/data/';

// Hent råt indhold fra URL som Buffer
function hentBuffer(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.get(
      {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk' },
        rejectUnauthorized: false,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return hentBuffer(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} fra ${url}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

// Hent tekst fra URL
async function hentTekst(url) {
  const buf = await hentBuffer(url);
  return buf.toString('utf-8');
}

// Udtræk href-links fra HTML-katalog
function udtrækLinks(html, baseUrl) {
  return [...html.matchAll(/href="([^"#?]+)"/gi)]
    .map((m) => m[1])
    .filter((h) => h !== '/' && !h.startsWith('mailto'))
    .map((h) => (h.startsWith('http') ? h : new URL(h, baseUrl).href));
}

// Find seneste SOR2-fil fra data-kataloget
async function findSenesteFilUrl() {
  const html = await hentTekst(SOR_BASE);
  const filer = udtrækLinks(html, SOR_BASE).filter((u) => /\.(zip|csv|gz)$/i.test(u));

  if (filer.length === 0) {
    console.log('Katalog-indhold (første 800 tegn):', html.slice(0, 800));
    throw new Error('Ingen SOR-filer fundet i kataloget');
  }

  const seneste = filer.sort().pop();
  console.log(`Fundet ${filer.length} filer, bruger: ${seneste}`);
  return seneste;
}

// Parse enkel CSV — håndterer quoted felter
function parseCSV(tekst) {
  const linjer = tekst.split(/\r?\n/).filter((l) => l.trim());
  if (linjer.length === 0) return [];

  function parseRække(linje) {
    const felter = [];
    let felt = '';
    let i_quote = false;
    for (let i = 0; i < linje.length; i++) {
      const c = linje[i];
      if (c === '"') {
        if (i_quote && linje[i + 1] === '"') { felt += '"'; i++; }
        else i_quote = !i_quote;
      } else if (c === ';' && !i_quote) {
        felter.push(felt); felt = '';
      } else {
        felt += c;
      }
    }
    felter.push(felt);
    return felter;
  }

  const headers = parseRække(linjer[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rækker = [];
  for (let i = 1; i < linjer.length; i++) {
    const vals = parseRække(linjer[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (vals[idx] ?? '').trim(); });
    rækker.push(obj);
  }
  return rækker;
}

// Find felt-værdi med flere mulige kolonnenavne
function felt(obj, ...kandidater) {
  for (const k of kandidater) {
    if (obj[k] !== undefined && obj[k] !== '') return obj[k];
  }
  return null;
}

// Map CSV-række til SOR-enhed
function mapRække(r) {
  const sorKode = felt(r, 'sor_kode', 'sorkode', 'sor-kode', 'enhedskode', 'sorid');
  if (!sorKode) return null;

  const aktiv = felt(r, 'aktiv', 'er_aktiv', 'active', 'status');
  const erAktiv = !aktiv || aktiv === '1' || aktiv.toLowerCase() === 'true' || aktiv.toLowerCase() === 'ja';

  return {
    sor_kode: sorKode,
    navn: felt(r, 'navn', 'enhedsnavn', 'name', 'organisationsnavn') ?? '',
    cvr: felt(r, 'cvr', 'cvr_nummer', 'cvrnummer', 'cvr-nummer'),
    adresse: felt(r, 'adresse', 'vejnavn', 'vejnavn_med_husnummer', 'adresselinje1'),
    postnummer: felt(r, 'postnummer', 'post_nr', 'postnr'),
    by: felt(r, 'postdistrikt', 'by', 'city', 'postby'),
    aktiv: erAktiv,
    synkroniseret: new Date().toISOString(),
  };
}

async function hentSorData() {
  let fileUrl;
  try {
    fileUrl = await findSenesteFilUrl();
  } catch (e) {
    throw new Error(`Kunne ikke finde SOR-fil i kataloget: ${e.message}`);
  }

  console.log(`Downloader: ${fileUrl}`);
  const buf = await hentBuffer(fileUrl);

  let tekst;
  if (fileUrl.endsWith('.gz')) {
    tekst = zlib.gunzipSync(buf).toString('utf-8');
  } else if (fileUrl.endsWith('.zip')) {
    // Prøv at læse ZIP som tekst (virker hvis det er en enkelt CSV)
    // Hvis det fejler, kast en klar fejl
    try {
      // Node 18 har ikke built-in ZIP — prøv at læse som Latin-1/UTF-8
      tekst = buf.toString('latin1');
      if (!tekst.includes(';') && !tekst.includes(',')) {
        tekst = buf.toString('utf-8');
      }
    } catch {
      throw new Error('ZIP-format kræver unzip — installer med: npm install adm-zip');
    }
  } else {
    tekst = buf.toString('utf-8');
    if (!tekst.includes(';') && !tekst.includes(',')) {
      tekst = buf.toString('latin1');
    }
  }

  const rækker = parseCSV(tekst);
  console.log(`Parsede ${rækker.length} rækker fra CSV`);
  if (rækker.length > 0) console.log('Kolonner:', Object.keys(rækker[0]).join(', '));

  const enheder = rækker.map(mapRække).filter(Boolean).filter((e) => e.aktiv);
  console.log(`${enheder.length} aktive enheder efter mapping`);
  return enheder;
}

// Https POST til Supabase
function httpsPost(url, headers, body) {
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
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
          else { try { resolve(data ? JSON.parse(data) : null); } catch { resolve(null); } }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(bodyBuf);
    req.end();
  });
}

async function upsertTilSupabase(enheder) {
  const BATCH = 500;
  const hdrs = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'resolution=merge-duplicates',
  };
  for (let i = 0; i < enheder.length; i += BATCH) {
    const batch = enheder.slice(i, i + BATCH);
    await httpsPost(`${SUPABASE_URL}/rest/v1/sor_bosteder_cache`, hdrs, JSON.stringify(batch));
    console.log(`Upsert ${Math.min(i + BATCH, enheder.length)}/${enheder.length}`);
  }
}

async function kørRpc(fn) {
  const hdrs = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };
  try {
    const data = await httpsPost(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, hdrs, '{}');
    return { opdaterede: data };
  } catch (e) {
    return { fejl: e.message };
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] SOR sync starter`);
  const enheder = await hentSorData();
  if (enheder.length === 0) { console.error('Ingen enheder hentet — stop.'); process.exit(1); }
  await upsertTilSupabase(enheder);
  console.log('Cache opdateret i Supabase');
  const stps = await kørRpc('match_sor_paa_stps');
  const tp   = await kørRpc('match_sor_paa_tp');
  console.log(`CVR-match stps: ${JSON.stringify(stps)}`);
  console.log(`CVR-match tp:   ${JSON.stringify(tp)}`);
  console.log(`[${new Date().toISOString()}] SOR sync færdig — ${enheder.length} enheder`);
}

main().catch((err) => {
  console.error('SOR sync fejl:', err.message);
  process.exit(1);
});
