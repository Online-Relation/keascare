// Selvstændigt regnskab-scraper til Docker på Synology.
// Henter årsregnskab fra regnskab.virk.dk for alle bosteder med CVR.
// Kræver env: SUPABASE_URL, SUPABASE_SERVICE_KEY
// Kør: node scraper.js

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Mangler SUPABASE_URL eller SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws },
});

const DELAY_MS = 400;
const BATCH = 100;

const FELT_NAVNE = {
  'fsa:GrossProfit':    'bruttofortjeneste',
  'fsa:Revenue':        'nettoomsaetning',
  'ifrs-full:Revenue':  'nettoomsaetning',
  'fsa:ProfitLoss':     'aarsresultat',
  'ifrs-full:ProfitLoss': 'aarsresultat',
  'fsa:Equity':         'egenkapital',
  'ifrs-full:Equity':   'egenkapital',
  'fsa:Assets':         'balance',
  'ifrs-full:Assets':   'balance',
};

function venteMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk' },
    timeout: 15_000,
    validateStatus: (s) => s < 500,
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
    regnskab_aar:              aar,
    regnskab_periode_start:    seneste.regnskabsperiode?.startDato ?? null,
    regnskab_periode_slut:     slutDato,
    regnskab_nettoomsaetning:  xbrl.nettoomsaetning ?? null,
    regnskab_bruttofortjeneste: xbrl.bruttofortjeneste ?? null,
    regnskab_aarsresultat:     xbrl.aarsresultat ?? null,
    regnskab_egenkapital:      xbrl.egenkapital ?? null,
    regnskab_balance:          xbrl.balance ?? null,
    regnskab_opdateret:        new Date().toISOString(),
  };
}

async function kørRegnskabScraper() {
  console.log('Henter bosteder med CVR uden regnskab...');

  const grænse = new Date();
  grænse.setDate(grænse.getDate() - 90);

  const { data: rækker, error } = await supabase
    .from('stps_rapporter')
    .select('id, cvr, stps_tilbud_navn')
    .not('cvr', 'is', null)
    .or(`regnskab_aar.is.null,regnskab_opdateret.lt.${grænse.toISOString()}`)
    .order('regnskab_opdateret', { ascending: true, nullsFirst: true })
    .limit(BATCH);

  if (error) throw new Error(`Supabase fejl: ${error.message}`);
  if (!rækker?.length) { console.log('Ingen at behandle — alt er opdateret'); return; }

  console.log(`Behandler ${rækker.length} bosteder...`);
  let opdateret = 0;
  let ingenData = 0;
  let fejl = 0;

  for (let i = 0; i < rækker.length; i++) {
    const { id, cvr, stps_tilbud_navn } = rækker[i];
    try {
      const regnskab = await hentRegnskab(cvr);

      if (!regnskab) {
        await supabase.from('stps_rapporter')
          .update({ regnskab_opdateret: new Date().toISOString() })
          .eq('id', id);
        ingenData++;
      } else {
        await supabase.from('stps_rapporter').update(regnskab).eq('id', id);
        opdateret++;
      }

      const status = regnskab ? `✓ ${regnskab.regnskab_aar}` : '—';
      process.stdout.write(`\r  ${i + 1}/${rækker.length} [${status}] ${(stps_tilbud_navn ?? cvr).substring(0, 40)}`);
    } catch (err) {
      fejl++;
      console.error(`\nFejl for CVR ${cvr}: ${err.message}`);
      await supabase.from('stps_rapporter')
        .update({ regnskab_opdateret: new Date().toISOString() })
        .eq('id', id);
    }

    if (i < rækker.length - 1) await venteMs(DELAY_MS);
  }

  console.log(`\n\nFærdig: ${opdateret} opdateret, ${ingenData} ingen data, ${fejl} fejl`);
}

// Loop til alle er behandlet
let runde = 0;
while (true) {
  runde++;
  if (runde > 1) console.log(`\nRunde ${runde}...`);
  await kørRegnskabScraper();

  const { count } = await supabase
    .from('stps_rapporter')
    .select('*', { count: 'exact', head: true })
    .not('cvr', 'is', null)
    .is('regnskab_aar', null)
    .is('regnskab_opdateret', null);

  if (!count || count === 0) break;
  console.log(`${count} tilbage uden forsøg...`);
}

console.log('Done ✓');
