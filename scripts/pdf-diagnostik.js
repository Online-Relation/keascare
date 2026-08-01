#!/usr/bin/env node
// scripts/pdf-diagnostik.js
// Kør på Synology for at se hvad der sker i de rapporter der IKKE får navne
// node /volume1/scripts/pdf-diagnostik.js 2>&1 | tee /tmp/diagnostik.txt

const https = require('https');
const http  = require('http');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BATCH = parseInt(process.env.BATCH ?? '20', 10);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Mangler SUPABASE_URL og/eller SUPABASE_SERVICE_KEY');
  process.exit(1);
}

function hentBuffer(url) {
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
        },
        rejectUnauthorized: false,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return hentBuffer(res.headers.location).then(resolve).catch(reject);
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

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  console.error('pdf-parse ikke installeret.');
  process.exit(1);
}

// Find alle varianter af sektionsoverskriften i teksten
function findSektioner(tekst) {
  const varianter = [
    /Tilsynet blev foretaget af/gi,
    /Tilsynet er foretaget af/gi,
    /Tilsynet er udført af/gi,
    /Tilsynet er gennemført af/gi,
    /Tilsynet blev udført af/gi,
    /foretaget af:/gi,
  ];
  const fund = [];
  for (const re of varianter) {
    let m;
    while ((m = re.exec(tekst)) !== null) {
      fund.push({ variant: re.source, idx: m.index, tekst: tekst.substring(m.index, m.index + 200) });
    }
  }
  return fund.sort((a, b) => a.idx - b.idx);
}

async function main() {
  // Hent rapporter der HAR pdf_url men mangler deltagere
  const url = `${SUPABASE_URL}/rest/v1/stps_rapporter` +
    `?select=id,stps_tilbud_navn,pdf_url` +
    `&pdf_url=not.is.null` +
    `&tilsyn_deltagere_stps=is.null` +
    `&order=rapport_dato.desc` +
    `&limit=${BATCH}`;

  const { status, body } = await httpsGet(url);
  if (status >= 400) { console.error('Supabase fejl', status); process.exit(1); }
  const rapporter = body ?? [];
  console.log(`Analyserer ${rapporter.length} rapporter...\n`);

  let ingenSektion = 0, navneFejl = 0, ok = 0;

  for (let i = 0; i < rapporter.length; i++) {
    const { stps_tilbud_navn, pdf_url } = rapporter[i];
    try {
      const buf = await hentBuffer(pdf_url);
      const { text: tekst } = await pdfParse(buf);

      const sektioner = findSektioner(tekst);

      if (sektioner.length === 0) {
        ingenSektion++;
        console.log(`[INGEN SEKTION] ${stps_tilbud_navn}`);
        // Vis de sidste 400 tegn af rapporten
        console.log('  Slut af tekst:', JSON.stringify(tekst.substring(Math.max(0, tekst.length - 400))));
        console.log();
      } else {
        // Find den SIDST forekommende
        const sidst = sektioner[sektioner.length - 1];
        const blok = tekst.substring(sidst.idx, sidst.idx + 400);
        const linjer = blok.split('\n').slice(0, 15);
        console.log(`[HAR SEKTION] ${stps_tilbud_navn}`);
        console.log(`  Variant: "${sidst.variant}" ved idx=${sidst.idx}`);
        console.log(`  Tekst (rå linjer):`);
        for (const l of linjer) {
          console.log(`    | ${JSON.stringify(l)}`);
        }
        console.log();
      }
    } catch (e) {
      console.log(`[FEJL] ${stps_tilbud_navn}: ${e.message}\n`);
    }

    if (i < rapporter.length - 1) await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\nOpsummering: ingen sektion=${ingenSektion}, ok=${ok}`);
}

main().catch((err) => { console.error('Fejl:', err.message); process.exit(1); });
