// Regnskab-scraper til Synology NAS — INGEN npm install nødvendig.
// Bruger kun Node.js built-in moduler (https).
//
// Kørsel i Task Scheduler eller terminal:
//   SUPABASE_URL=https://gclg... SUPABASE_SERVICE_KEY=sb_secret_... node /volume1/scripts/regnskab-synology.js

'use strict';
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Mangler SUPABASE_URL eller SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const DELAY_MS = 400;
const BATCH = 100;

const FELT_NAVNE = {
  'fsa:GrossProfit':      'bruttofortjeneste',
  'fsa:Revenue':          'nettoomsaetning',
  'ifrs-full:Revenue':    'nettoomsaetning',
  'fsa:ProfitLoss':       'aarsresultat',
  'ifrs-full:ProfitLoss': 'aarsresultat',
  'fsa:Equity':           'egenkapital',
  'ifrs-full:Equity':     'egenkapital',
  'fsa:Assets':           'balance',
  'ifrs-full:Assets':     'balance',
};

function venteMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simpel HTTPS GET der returnerer parsed JSON
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Supabase REST API wrapper
async function supabaseSelect(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await httpsGet(url, {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Accept': 'application/json',
    'Prefer': 'count=exact',
  });
  if (res.status >= 400) throw new Error(`Supabase SELECT fejl ${res.status}: ${JSON.stringify(res.data)}`);
  return res.data;
}

function supabaseUpdate(table, id, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=minimal',
      },
    };
    const req = https.request(options, (res) => {
      res.resume();
      res.on('end', () => resolve());
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function supabaseInsert(table, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=minimal',
      },
    };
    const req = https.request(options, (res) => {
      res.resume();
      res.on('end', () => resolve());
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseXbrl(felter) {
  const resultat = {};
  for (const felt of felter) {
    const nøgle = felt.name;
    if (!nøgle) continue;
    const mål = FELT_NAVNE[nøgle];
    if (!mål) continue;
    const v = typeof felt.value === 'number' ? felt.value : parseFloat(String(felt.value ?? ''));
    if (!isNaN(v) && resultat[mål] === undefined) resultat[mål] = v;
  }
  return resultat;
}

async function hentRegnskab(cvr) {
  const url = `https://regnskab.virk.dk/regnskab/xbrl/api/1/regnskab?cvrnummer=${cvr}`;
  const res = await httpsGet(url, {
    'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk',
  });

  if (res.status === 404) return null;
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

  const liste = res.data;
  if (!Array.isArray(liste) || liste.length === 0) return null;

  const seneste = liste.sort((a, b) => {
    const da = a.regnskabsperiode?.slutDato ?? a.indsendelsesDato ?? '';
    const db = b.regnskabsperiode?.slutDato ?? b.indsendelsesDato ?? '';
    return db.localeCompare(da);
  })[0];

  const xbrl = parseXbrl(seneste.xbrlData ?? []);
  const slutDato = seneste.regnskabsperiode?.slutDato ?? null;
  const aar = slutDato ? new Date(slutDato).getFullYear() : null;

  return {
    regnskab_aar:               aar,
    regnskab_periode_start:     seneste.regnskabsperiode?.startDato ?? null,
    regnskab_periode_slut:      slutDato,
    regnskab_nettoomsaetning:   xbrl.nettoomsaetning ?? null,
    regnskab_bruttofortjeneste: xbrl.bruttofortjeneste ?? null,
    regnskab_aarsresultat:      xbrl.aarsresultat ?? null,
    regnskab_egenkapital:       xbrl.egenkapital ?? null,
    regnskab_balance:           xbrl.balance ?? null,
    regnskab_opdateret:         new Date().toISOString(),
  };
}

async function kørBatch() {
  const grænse = new Date();
  grænse.setDate(grænse.getDate() - 90);

  const params = [
    'select=id,cvr,stps_tilbud_navn',
    'cvr=not.is.null',
    `or=(regnskab_aar.is.null,regnskab_opdateret.lt.${grænse.toISOString()})`,
    'order=regnskab_opdateret.asc.nullsfirst',
    `limit=${BATCH}`,
  ].join('&');

  const rækker = await supabaseSelect('stps_rapporter', params);
  if (!Array.isArray(rækker) || rækker.length === 0) {
    console.log('Ingen at behandle — alt er opdateret');
    return 0;
  }

  console.log(`Behandler ${rækker.length} bosteder...`);
  let opdateret = 0, ingenData = 0, fejl = 0;

  for (let i = 0; i < rækker.length; i++) {
    const { id, cvr, stps_tilbud_navn } = rækker[i];
    try {
      const regnskab = await hentRegnskab(cvr);

      if (!regnskab) {
        await supabaseUpdate('stps_rapporter', id, { regnskab_opdateret: new Date().toISOString() });
        ingenData++;
      } else {
        await supabaseUpdate('stps_rapporter', id, regnskab);
        opdateret++;
      }

      const status = regnskab ? `✓ ${regnskab.regnskab_aar}` : '—';
      process.stdout.write(`\r  ${i + 1}/${rækker.length} [${status}] ${(stps_tilbud_navn ?? cvr).substring(0, 40)}`);
    } catch (err) {
      fejl++;
      console.error(`\nFejl for CVR ${cvr}: ${err.message}`);
      await supabaseUpdate('stps_rapporter', id, { regnskab_opdateret: new Date().toISOString() }).catch(() => {});
    }

    if (i < rækker.length - 1) await venteMs(DELAY_MS);
  }

  console.log(`\n\nFærdig: ${opdateret} opdateret, ${ingenData} ingen data, ${fejl} fejl`);
  return rækker.length;
}

// Kør til alt er behandlet
async function main() {
  console.log(`=== Regnskab-scraper ${new Date().toLocaleString('da-DK')} ===`);
  let runde = 0;
  try {
    while (true) {
      runde++;
      if (runde > 1) console.log(`\nRunde ${runde}...`);
      const behandlet = await kørBatch();
      if (behandlet === 0) break;

      const tjekParams = 'select=id&cvr=not.is.null&regnskab_aar=is.null&regnskab_opdateret=is.null&limit=1';
      const tilbage = await supabaseSelect('stps_rapporter', tjekParams);
      if (!Array.isArray(tilbage) || tilbage.length === 0) break;
      console.log('Flere tilbage...');
    }

    console.log('Done ✓');
    await supabaseInsert('scraper_log', {
      scraper_id: 'regnskab',
      ok: true,
      resultat: { ok: true, runder: runde },
      kørt_kl: new Date().toISOString(),
    }).catch(() => {});
  } catch (err) {
    console.error('Kritisk fejl:', err.message);
    await supabaseInsert('scraper_log', {
      scraper_id: 'regnskab',
      ok: false,
      resultat: { error: err.message },
      kørt_kl: new Date().toISOString(),
    }).catch(() => {});
    process.exit(1);
  }
}

main();
