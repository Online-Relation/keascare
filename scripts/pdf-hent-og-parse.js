#!/usr/bin/env node
// scripts/pdf-hent-og-parse.js
// Henter STPS-rapporter der mangler pdf_url: besøger rapport-siden på gopublic.dk,
// finder PDF-linket, parser PDF'en og gemmer resultatet i Supabase.
// Kræver dansk IP (kør fra Synology) — gopublic.dk blokerer udenlandske IP'er.
// Krav: node 18+, npm install pdf-parse@1.1.1
// Cron: 0 3 * * * /volume1/@appstore/Node.js_v18/usr/local/bin/node /volume1/scripts/pdf-hent-og-parse.js

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

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer':    'https://stps.dk/',
};

function hentTekst(url, ekstraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.get(
      {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        headers:  { ...BROWSER_HEADERS, ...ekstraHeaders },
        rejectUnauthorized: false,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : `${parsedUrl.protocol}//${parsedUrl.hostname}${res.headers.location}`;
          return hentTekst(next, ekstraHeaders).then(resolve).catch(reject);
        }
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode} fra ${url}`));
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function hentBuffer(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.get(
      {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        headers:  { ...BROWSER_HEADERS, 'Accept': 'application/pdf,*/*' },
        rejectUnauthorized: false,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : `${parsedUrl.protocol}//${parsedUrl.hostname}${res.headers.location}`;
          return hentBuffer(next).then(resolve).catch(reject);
        }
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode} fra ${url}`));
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

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.get(
      {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        headers:  { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
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

function httpsPost(url, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const bodyBuf = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body));
    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        method:   'POST',
        headers:  {
          'Content-Length': bodyBuf.length,
          'apikey':         SUPABASE_KEY,
          'Authorization':  `Bearer ${SUPABASE_KEY}`,
          ...extraHeaders,
        },
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
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout upload')); });
    req.write(bodyBuf);
    req.end();
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

// ── Hent rapporter uden pdf_url ────────────────────────────────────────────

async function hentRapporterUdenPdf() {
  const url = `${SUPABASE_URL}/rest/v1/stps_rapporter` +
    `?select=id,stps_tilbud_navn,rapport_url` +
    `&pdf_url=is.null` +
    `&limit=${BATCH}`;

  const { status, body } = await httpsGet(url);
  if (status >= 400) throw new Error(`Supabase fejl ${status}: ${JSON.stringify(body)}`);
  return body ?? [];
}

// ── Find PDF-link i HTML ───────────────────────────────────────────────────

function udtraekPdfUrl(html, rapportUrl) {
  // Søg efter href der slutter på .pdf og indeholder gopublic eller cdn
  const matches = [...html.matchAll(/href="([^"]*\.pdf[^"]*)"/gi)];
  for (const m of matches) {
    const href = m[1];
    if (href.includes('gopublic') || href.includes('cdn') || href.includes('stps')) {
      return href.startsWith('http') ? href : `https://gopublic.dk${href}`;
    }
  }
  // Bredere søgning: ethvert .pdf-link
  const bredMatch = html.match(/href="([^"]*\.pdf)"/i);
  if (bredMatch) {
    const href = bredMatch[1];
    return href.startsWith('http') ? href : `https://gopublic.dk${href}`;
  }
  return null;
}

// ── PDF-parsing ─────────────────────────────────────────────────────────────

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  console.error('pdf-parse ikke installeret. Kør: npm install pdf-parse@1.1.1');
  process.exit(1);
}

const NAVN_REGEX = /^[A-ZÆØÅ][a-zæøå]{1,}(?:[-][A-Za-zæøå]+)?(?:\s[A-ZÆØÅ][a-zæøå]{1,}(?:[-][A-Za-zæøå]+)?){1,3}$/;

function erNavn(s) {
  if (!s || s.length < 4 || s.length > 60) return false;
  if (s.split(/\s+/).length < 2) return false;
  return NAVN_REGEX.test(s);
}

function parsDeltagereBlok(tekst, startIdx) {
  const blok = tekst.substring(startIdx, startIdx + 800);
  const linjer = blok.split('\n').map((l) => l.trim());
  const deltagere = [];
  let tomLinjer = 0;

  for (const rawLinje of linjer) {
    const linje = rawLinje.replace(/^[^A-Za-zÆØÅæøå]+/, '').trim();

    if (!linje) {
      if (deltagere.length > 0) { tomLinjer++; if (tomLinjer >= 2) break; }
      continue;
    }
    tomLinjer = 0;

    if (/^(Tilsynet (?:blev|er) (?:foretaget|udført|gennemført) af|Ved tilsynet|Lovgrundlag|Baggrundsoplysninger|Samlet vurdering|Fund ved|Vi afslutter|Rapporten er)/i.test(linje)) {
      if (deltagere.length > 0) break;
      continue;
    }

    if (linje.length > 70) continue;

    const kommaIdx = linje.indexOf(',');
    if (kommaIdx > 3) {
      const muligNavn = linje.substring(0, kommaIdx).trim();
      const muligTitel = linje.substring(kommaIdx + 1).trim();
      if (erNavn(muligNavn)) {
        deltagere.push({ navn: muligNavn, titel: muligTitel || null });
        continue;
      }
    }

    if (erNavn(linje)) deltagere.push({ navn: linje, titel: null });
  }

  return deltagere;
}

function sidsteMatch(tekst, regex) {
  let sidst = -1, m;
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((m = re.exec(tekst)) !== null) sidst = m.index;
  return sidst;
}

function udtraekDeltagere(tekst) {
  const stpsIdx   = sidsteMatch(tekst, /Tilsynet (?:blev|er) (?:foretaget|udført|gennemført) af/i);
  const bostedIdx = sidsteMatch(tekst, /Ved tilsynet[\s\S]{0,30}deltog/i);
  return {
    stps:   stpsIdx   !== -1 ? parsDeltagereBlok(tekst, stpsIdx)   : [],
    bosted: bostedIdx !== -1 ? parsDeltagereBlok(tekst, bostedIdx) : [],
  };
}

// ── Upload PDF til Supabase Storage ────────────────────────────────────────

async function uploadPdf(id, buf) {
  const filnavn = `${id}.pdf`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/stps-pdfer/${filnavn}`;

  const { status } = await httpsPost(uploadUrl, buf, {
    'Content-Type':  'application/pdf',
    'x-upsert':      'true',
  });

  if (status >= 400) return null;

  // Byg den offentlige URL
  return `${SUPABASE_URL}/storage/v1/object/public/stps-pdfer/${filnavn}`;
}

// ── Gem i Supabase ──────────────────────────────────────────────────────────

async function gem(id, pdfUrl, pdfStorageUrl, stps, bosted) {
  const url = `${SUPABASE_URL}/rest/v1/stps_rapporter?id=eq.${id}`;
  const body = {
    pdf_url:                 pdfUrl,
    pdf_storage_url:         pdfStorageUrl,
    tilsyn_deltagere_stps:   stps.length   > 0 ? stps   : null,
    tilsyn_deltagere_bosted: bosted.length > 0 ? bosted : null,
    pdf_behandlet:           true,
  };
  const { status } = await httpsPatch(url, body);
  if (status >= 400) throw new Error(`PATCH fejlede med status ${status}`);
}

function vent(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Hoved ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[${new Date().toISOString()}] PDF hent-og-parse starter (batch=${BATCH})`);

  const rapporter = await hentRapporterUdenPdf();
  console.log(`${rapporter.length} rapporter mangler pdf_url`);

  if (rapporter.length === 0) {
    console.log('Intet at gøre.');
    return;
  }

  let ok = 0, ingenPdf = 0, fejl = 0;

  for (let i = 0; i < rapporter.length; i++) {
    const { id, stps_tilbud_navn, rapport_url } = rapporter[i];
    try {
      // Spring syntetiske rapport-URLs over
      if (rapport_url.startsWith('stps://')) {
        await httpsPatch(`${SUPABASE_URL}/rest/v1/stps_rapporter?id=eq.${id}`, { pdf_behandlet: true });
        ingenPdf++;
        continue;
      }

      // 1. Hent rapport-side og find PDF-link
      const html = await hentTekst(rapport_url);
      const pdfUrl = udtraekPdfUrl(html, rapport_url);

      if (!pdfUrl) {
        // Ingen PDF på denne side — marker behandlet så vi ikke forsøger igen
        await httpsPatch(`${SUPABASE_URL}/rest/v1/stps_rapporter?id=eq.${id}`, { pdf_behandlet: true });
        console.log(`[${i+1}/${rapporter.length}] INGEN PDF: ${stps_tilbud_navn}`);
        ingenPdf++;
        continue;
      }

      // 2. Download PDF
      const buf = await hentBuffer(pdfUrl);

      // 3. Upload til Supabase Storage
      const pdfStorageUrl = await uploadPdf(id, buf);

      // 4. Parse PDF
      const { text: tekst } = await pdfParse(buf);
      const { stps, bosted } = udtraekDeltagere(tekst);

      // 5. Gem
      await gem(id, pdfUrl, pdfStorageUrl, stps, bosted);
      console.log(`[${i+1}/${rapporter.length}] OK: ${stps_tilbud_navn} — ${stps.length} STPS, ${bosted.length} bosted${pdfStorageUrl ? ' (gemt i storage)' : ''}`);
      ok++;
    } catch (e) {
      console.error(`[${i+1}/${rapporter.length}] FEJL: ${stps_tilbud_navn} — ${e.message}`);
      fejl++;
    }

    if (i < rapporter.length - 1) await vent(1000);
  }

  console.log(`[${new Date().toISOString()}] Færdig — ${ok} ok, ${ingenPdf} ingen PDF, ${fejl} fejl`);
}

main().catch((err) => {
  console.error('Fejl:', err.message);
  process.exit(1);
});
