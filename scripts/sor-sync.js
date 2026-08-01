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

// Parse CSV-linje — håndterer quoted felter
function parseRække(linje) {
  const felter = [];
  let felt = '';
  let i_quote = false;
  for (let i = 0; i < linje.length; i++) {
    const c = linje[i];
    if (c === '"') {
      if (i_quote && linje[i + 1] === '"') { felt += '"'; i++; }
      else i_quote = !i_quote;
    } else if ((c === ';' || c === ',') && !i_quote) {
      felter.push(felt); felt = '';
    } else {
      felt += c;
    }
  }
  felter.push(felt);
  return felter;
}

// Parse CSV fra Buffer linje for linje — undgår Node.js string-størrelsesgrænse
function parseCSVBuffer(buf) {
  const rækker = [];
  let headers = null;
  let lineStart = 0;

  for (let i = 0; i <= buf.length; i++) {
    const byte = buf[i];
    if (byte === 0x0a || i === buf.length) {
      const end = (i > 0 && buf[i - 1] === 0x0d) ? i - 1 : i;
      if (end > lineStart) {
        const linje = buf.latin1Slice(lineStart, end);
        if (!headers) {
          headers = parseRække(linje).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
        } else {
          const vals = parseRække(linje);
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = (vals[idx] ?? '').trim(); });
          rækker.push(obj);
        }
      }
      lineStart = i + 1;
    }
  }
  return rækker;
}

// Behold string-version til GZ/plain tekstfiler
function parseCSV(tekst) {
  const linjer = tekst.split(/\r?\n/).filter((l) => l.trim());
  if (linjer.length === 0) return [];
  const headers = parseRække(linjer[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rækker = [];
  for (let i = 1; i < linjer.length; i++) {
    if (!linjer[i].trim()) continue;
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

// Map CSV-række til SOR-enhed (kolonner fra SOREntity.csv)
function mapRække(r) {
  // sorid kan have BOM-præfiks på første kolonne
  const sorKode = felt(r, 'sorid', '﻿sorid', 'ï»¿sorid');
  if (!sorKode) return null;

  // Aktiv = ingen todate sat
  const todate = felt(r, 'todate');
  const erAktiv = !todate || todate.trim() === '';

  const vejnavn  = felt(r, 'postaladdressstreetname') ?? '';
  const husnr    = felt(r, 'postaladdressstreetbuildingid') ?? '';
  const adresse  = husnr ? `${vejnavn} ${husnr}`.trim() : vejnavn;

  return {
    sor_kode: sorKode,
    navn: felt(r, 'entityname') ?? '',
    cvr: felt(r, 'institutionownercvrnumberid'),
    adresse: adresse || null,
    postnummer: felt(r, 'postaladdresspostcodeid'),
    by: felt(r, 'postaladdressdistrictname'),
    aktiv: erAktiv,
    synkroniseret: new Date().toISOString(),
  };
}

// Find ZIP-entry metadata uden at udpakke data
function findZipEntries(zipBuf) {
  const entries = [];
  let offset = 0;
  while (offset < zipBuf.length - 4) {
    const sig = zipBuf.readUInt32LE(offset);
    if (sig !== 0x04034b50) { offset++; continue; }
    const compression = zipBuf.readUInt16LE(offset + 8);
    const compSize    = zipBuf.readUInt32LE(offset + 18);
    const uncompSize  = zipBuf.readUInt32LE(offset + 22);
    const nameLen     = zipBuf.readUInt16LE(offset + 26);
    const extraLen    = zipBuf.readUInt16LE(offset + 28);
    const name        = zipBuf.slice(offset + 30, offset + 30 + nameLen).toString('utf-8');
    const dataStart   = offset + 30 + nameLen + extraLen;
    if (name.match(/\.csv$/i) && compSize > 0) {
      entries.push({ name, uncompSize, compression, dataStart, compSize });
    }
    offset = dataStart + compSize;
  }
  return entries;
}

// Stream-parse ZIP-entry linje for linje — holder aldrig hele filen i RAM
function parseZipEntryStream(zipBuf, entry) {
  return new Promise((resolve, reject) => {
    const { Readable } = require('stream');

    const compData = zipBuf.slice(entry.dataStart, entry.dataStart + entry.compSize);
    const source = Readable.from([compData]);
    const inflater = entry.compression === 8 ? zlib.createInflateRaw() : null;
    const stream = inflater ? source.pipe(inflater) : source;

    let headers = null;
    let rest = '';
    const enheder = [];

    stream.on('data', (chunk) => {
      const tekst = rest + chunk.toString('latin1');
      const linjer = tekst.split('\n');
      rest = linjer.pop(); // gem ufærdig linje

      for (const linje of linjer) {
        const l = linje.endsWith('\r') ? linje.slice(0, -1) : linje;
        if (!l) continue;
        if (!headers) {
          headers = parseRække(l).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
          console.log('CSV kolonner:', headers.join(', '));
        } else {
          const vals = parseRække(l);
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = (vals[idx] ?? '').trim(); });
          const enhed = mapRække(obj);
          if (enhed && enhed.aktiv) enheder.push(enhed);
        }
      }
    });

    stream.on('end', () => {
      if (rest.trim() && headers) {
        const vals = parseRække(rest);
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = (vals[idx] ?? '').trim(); });
        const enhed = mapRække(obj);
        if (enhed && enhed.aktiv) enheder.push(enhed);
      }
      resolve(enheder);
    });

    stream.on('error', reject);
  });
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
    const entries = findZipEntries(buf);
    if (entries.length === 0) throw new Error('Ingen CSV-filer fundet i ZIP');
    entries.sort((a, b) => b.uncompSize - a.uncompSize);
    console.log(`ZIP CSV-filer: ${entries.map((e) => `${e.name} (${e.uncompSize} bytes)`).join(', ')}`);
    const valgt = entries[0];
    console.log(`Stream-parser: ${valgt.name}`);
    const enheder = await parseZipEntryStream(buf, valgt);
    console.log(`${enheder.length} aktive enheder efter mapping`);
    return enheder;
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
