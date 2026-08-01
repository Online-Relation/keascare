#!/usr/bin/env node
// scripts/pdf-parse-deltagere.js
// Henter STPS PDF'er fra gopublic.dk og udtrækker inspektør- og deltagernavne
// Kræver dansk IP (kør fra Synology) — gopublic.dk blokerer udenlandske IP'er
// Krav: node 18+, npm install pdf-parse
// Cron: 0 4 * * * /volume1/@appstore/Node.js_v18/usr/local/bin/node /volume1/scripts/pdf-parse-deltagere.js

const https = require('https');
const http  = require('http');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BATCH = parseInt(process.env.BATCH ?? '30', 10);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Mangler SUPABASE_URL og/eller SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// ── HTTP-hjælpere ──────────────────────────────────────────────────────────

function hentBuffer(url, ekstraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.get(
      {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        headers:  {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept':     'application/pdf,*/*',
          'Referer':    'https://stps.dk/',
          ...ekstraHeaders,
        },
        rejectUnauthorized: false,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return hentBuffer(res.headers.location, ekstraHeaders).then(resolve).catch(reject);
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

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.get(
      {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        headers:  { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, ...headers },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function httpsPatch(url, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const bodyBuf = Buffer.from(JSON.stringify(body));
    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        method:   'PATCH',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': bodyBuf.length,
          'apikey':         SUPABASE_KEY,
          'Authorization':  `Bearer ${SUPABASE_KEY}`,
          'Prefer':         'return=minimal',
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(bodyBuf);
    req.end();
  });
}

// ── Hent rapporter der mangler deltager-data ────────────────────────────────

async function hentRapporterUdenDeltagere() {
  const url = `${SUPABASE_URL}/rest/v1/stps_rapporter` +
    `?select=id,stps_tilbud_navn,pdf_url` +
    `&pdf_url=not.is.null` +
    `&tilsyn_deltagere_stps=is.null` +
    `&order=rapport_dato.desc` +
    `&limit=${BATCH}`;

  const { status, body } = await httpsGet(url);
  if (status >= 400) throw new Error(`Supabase fejl ${status}: ${JSON.stringify(body)}`);
  return body ?? [];
}

// ── PDF-parsing ─────────────────────────────────────────────────────────────

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  console.error('pdf-parse ikke installeret. Kør: npm install pdf-parse@1.1.1');
  process.exit(1);
}

async function parsePdf(buf) {
  const resultat = await pdfParse(buf);
  return resultat.text ?? '';
}

// Navn-regex: Fornavn [Mellemnavn] Efternavn — 2-4 ord, kun bogstaver og bindestreg
const NAVN_REGEX = /^[A-ZÆØÅ][a-zæøå]{1,}(?:[-][A-Za-zæøå]+)?(?:\s[A-ZÆØÅ][a-zæøå]{1,}(?:[-][A-Za-zæøå]+)?){1,3}$/;

function erNavn(s) {
  if (!s || s.length < 4 || s.length > 60) return false;
  if (s.split(/\s+/).length < 2) return false;
  return NAVN_REGEX.test(s);
}

function parsDeltagereBlok(tekst, startIdx) {
  const efter = tekst.substring(startIdx);

  // Tag de første 800 tegn efter overskriften
  const blok = efter.substring(0, 800);
  const linjer = blok.split('\n').map((l) => l.trim());

  const deltagere = [];
  let tomLinjer = 0;

  for (const rawLinje of linjer) {
    // Strip alt der ikke er et bogstav foran teksten (bullets, tal, mellemrum)
    const linje = rawLinje.replace(/^[^A-Za-zÆØÅæøå]+/, '').trim();

    if (!linje) {
      // Tillad op til 2 tomme linjer inden vi stopper — navnelister kan have blanke linjer
      if (deltagere.length > 0) {
        tomLinjer++;
        if (tomLinjer >= 2) break;
      }
      continue;
    }
    tomLinjer = 0;

    // Stop ved næste sektion
    if (/^(Tilsynet blev foretaget af|Tilsynet er foretaget af|Tilsynet er udført af|Ved tilsynet|Lovgrundlag|Baggrundsoplysninger|Samlet vurdering|Fund ved|Vi afslutter|Rapporten er)/i.test(linje)) {
      if (deltagere.length > 0) break;
      continue;
    }

    // Spring lange linjer over (løbende tekst)
    if (linje.length > 70) continue;

    // Format: "Fornavn Efternavn, titel"
    const kommaIdx = linje.indexOf(',');
    if (kommaIdx > 3) {
      const muligNavn = linje.substring(0, kommaIdx).trim();
      const muligTitel = linje.substring(kommaIdx + 1).trim();
      if (erNavn(muligNavn)) {
        deltagere.push({ navn: muligNavn, titel: muligTitel || null });
        continue;
      }
    }

    // Format: bart navn
    if (erNavn(linje)) {
      deltagere.push({ navn: linje, titel: null });
    }
  }

  return deltagere;
}

function sidsteMatch(tekst, regex) {
  let sidst = -1, m;
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((m = re.exec(tekst)) !== null) sidst = m.index;
  return sidst;
}

function udtraekDeltagere(tekst, debug = false) {
  // Søg efter alle kendte varianter af sektionsoverskriften — brug den SIDSTE forekomst
  const stpsIdx = sidsteMatch(tekst, /Tilsynet (?:blev|er) (?:foretaget|udført|gennemført) af/i);
  const bostedIdx = sidsteMatch(tekst, /Ved tilsynet[\s\S]{0,30}deltog/i);

  if (debug) {
    console.log('--- RAÅ TEKST VED STPS-SEKTION ---');
    if (stpsIdx !== -1) console.log(JSON.stringify(tekst.substring(stpsIdx, stpsIdx + 400)));
    else console.log('IKKE FUNDET');
  }

  return {
    stps:   stpsIdx   !== -1 ? parsDeltagereBlok(tekst, stpsIdx)   : [],
    bosted: bostedIdx !== -1 ? parsDeltagereBlok(tekst, bostedIdx) : [],
  };
}

// ── Gem i Supabase ──────────────────────────────────────────────────────────

async function gemDeltagere(id, stps, bosted) {
  const url = `${SUPABASE_URL}/rest/v1/stps_rapporter?id=eq.${id}`;
  const body = {
    tilsyn_deltagere_stps:   stps.length   > 0 ? stps   : null,
    tilsyn_deltagere_bosted: bosted.length > 0 ? bosted : null,
  };
  const { status } = await httpsPatch(url, body);
  if (status >= 400) throw new Error(`PATCH fejlede med status ${status}`);
}

function vent(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Hoved ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[${new Date().toISOString()}] PDF deltager-parse starter (batch=${BATCH})`);

  const rapporter = await hentRapporterUdenDeltagere();
  console.log(`${rapporter.length} rapporter mangler deltager-data`);

  if (rapporter.length === 0) {
    console.log('Intet at gøre.');
    return;
  }

  let ok = 0, fejl = 0;

  for (let i = 0; i < rapporter.length; i++) {
    const { id, stps_tilbud_navn, pdf_url } = rapporter[i];
    try {
      const buf = await hentBuffer(pdf_url);
      const tekst = await parsePdf(buf);
      const debug = i === 0; // log rå tekst for første rapport
      const { stps, bosted } = udtraekDeltagere(tekst, debug);
      await gemDeltagere(id, stps, bosted);
      console.log(`[${i+1}/${rapporter.length}] OK: ${stps_tilbud_navn} — ${stps.length} STPS, ${bosted.length} bosted`);
      ok++;
    } catch (e) {
      console.error(`[${i+1}/${rapporter.length}] FEJL: ${stps_tilbud_navn} — ${e.message}`);
      fejl++;
    }
    if (i < rapporter.length - 1) await vent(800);
  }

  console.log(`[${new Date().toISOString()}] Færdig — ${ok} ok, ${fejl} fejl`);
}

main().catch((err) => {
  console.error('Fejl:', err.message);
  process.exit(1);
});
