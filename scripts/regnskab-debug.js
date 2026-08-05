// Debug-script: tester ét CVR-opslag og viser fuld fejl
'use strict';
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function main() {
  // 1. Hent første 3 rækker med CVR
  const url = `${SUPABASE_URL}/rest/v1/stps_rapporter?select=id,cvr,stps_tilbud_navn&cvr=not.is.null&limit=3`;
  console.log('Henter CVR-rækker fra Supabase...');
  const dbRes = await httpsGet(url, {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Accept': 'application/json',
  });
  console.log('DB status:', dbRes.status);
  console.log('DB data:', JSON.stringify(dbRes.data, null, 2));

  if (!Array.isArray(dbRes.data) || dbRes.data.length === 0) {
    console.log('Ingen rækker fundet');
    return;
  }

  // 2. Test regnskab.virk.dk med første CVR
  const { cvr, stps_tilbud_navn } = dbRes.data[0];
  console.log(`\nTester regnskab for CVR: "${cvr}" (${stps_tilbud_navn})`);

  const virkUrl = `https://regnskab.virk.dk/regnskab/xbrl/api/1/regnskab?cvrnummer=${cvr}`;
  console.log('URL:', virkUrl);

  try {
    const res = await httpsGet(virkUrl, { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk' });
    console.log('Virk status:', res.status);
    if (Array.isArray(res.data)) {
      console.log(`Virk: ${res.data.length} regnskaber fundet`);
      if (res.data.length > 0) console.log('Første:', JSON.stringify(res.data[0]).substring(0, 300));
    } else {
      console.log('Virk svar:', JSON.stringify(res.data).substring(0, 500));
    }
  } catch (err) {
    console.error('Fejl ved Virk-kald:', err.message);
  }
}

main().catch((err) => { console.error('Kritisk:', err.message); process.exit(1); });
