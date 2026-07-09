// Selvstændigt Tilbudsportalen-scraper til Docker på Synology.
// Kræver env: SUPABASE_URL, SUPABASE_SERVICE_KEY
// Kør: node scraper.js [liste|detaljer|begge]

import axios from 'axios';
import { load } from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Mangler SUPABASE_URL eller SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TP_LISTE_URL = 'https://tilbudsportalen.dk/tilbudssoegning/SoegVoksneTilbud/index';
const TP_DETALJE_URL = 'https://tilbudsportalen.dk/tilbudssoegning/tilbudDetaljeside/index';
const TP_FILTER_PARAMS =
  'tilbudstyperVoksne=juridiskgrundlag.voksne.bo.botilbudmaalrettetunge' +
  '&tilbudstyperVoksne=juridiskgrundlag.voksne.laengerevarendebo.laengerevarendebo' +
  '&tilbudstyperVoksne=juridiskgrundlag.voksne.laengerevarendebo.midlertidigtbo' +
  '&sortering=RELEVANS';
const TP_RESULTATER_PR_SIDE = 20;
const TP_DELAY_MS = 1000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Upgrade-Insecure-Requests': '1',
};

const client = axios.create({ timeout: 20_000, headers: HEADERS, maxRedirects: 5 });

function venteMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseListeSide(html) {
  const $ = load(html);
  const items = [];
  const selector = $('a.linkUdenUnderstreg[href*="tilbudDetaljeside"]').length > 0
    ? 'a.linkUdenUnderstreg[href*="tilbudDetaljeside"]'
    : 'a[href*="tilbudDetaljeside"], a[href*="tilbudsid"]';

  $(selector).each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const url = new URL(href, 'https://tilbudsportalen.dk');
    const tilbudsid = url.searchParams.get('tilbudsid') ?? '';
    const afdelingsid = url.searchParams.get('afdelingsid') ?? '';
    if (!tilbudsid || !afdelingsid) return;
    const navn = $(el).find('h3').first().text().trim();
    if (!navn) return;
    const detaljeUrl = `${TP_DETALJE_URL}?tilbudsid=${tilbudsid}&afdelingsid=${afdelingsid}&aktivtMenupunkt=VOKSNE`;
    items.push({ tilbudsid, afdelingsid, navn, url: detaljeUrl });
  });
  return items;
}

async function scraperListe(maxSider = 100) {
  console.log('Starter liste-scraping...');
  const alle = [];
  let cookieStr = '';

  const init = await client.get(`${TP_LISTE_URL}?${TP_FILTER_PARAMS}&offset=0`, { responseType: 'text' });
  const rawCookies = init.headers['set-cookie'] ?? [];
  cookieStr = rawCookies.map((c) => c.split(';')[0]).join('; ');

  const initHtml = load(init.data);
  const hiddenTotal = initHtml('input[name="totalResultater"]').first().val();
  let total = hiddenTotal ? parseInt(hiddenTotal, 10) : 0;
  if (!total) {
    const match = init.data.match(/(\d[\d.]+)\s+resultater/);
    if (match) total = parseInt(match[1].replace(/\./g, ''), 10);
  }

  const antalSider = Math.min(maxSider, Math.ceil(total / TP_RESULTATER_PR_SIDE));
  console.log(`Fandt ${total} resultater på ${antalSider} sider`);

  alle.push(...parseListeSide(init.data));

  for (let side = 2; side <= antalSider; side++) {
    const offset = (side - 1) * TP_RESULTATER_PR_SIDE;
    try {
      const res = await client.get(`${TP_LISTE_URL}?${TP_FILTER_PARAMS}&offset=${offset}`, {
        responseType: 'text',
        headers: { Cookie: cookieStr },
      });
      alle.push(...parseListeSide(res.data));
      process.stdout.write(`\r  Side ${side}/${antalSider} — ${alle.length} tilbud`);
      await venteMs(TP_DELAY_MS);
    } catch (err) {
      console.error(`\nFejl på side ${side}: ${err.message}`);
    }
  }

  console.log(`\nHentede ${alle.length} tilbud — gemmer i Supabase...`);

  const unikke = new Map();
  for (const item of alle) unikke.set(item.afdelingsid, item);

  const rækker = Array.from(unikke.values()).map((item) => ({
    tilbudsid: item.tilbudsid,
    afdelingsid: item.afdelingsid,
    navn: item.navn,
    tilbudsportalen_url: item.url,
    detaljer_hentet: false,
    scraper_dato: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('tilbudsportalen_tilbud')
    .upsert(rækker, { onConflict: 'afdelingsid', ignoreDuplicates: false });

  if (error) throw new Error(`Supabase fejl: ${error.message}`);
  console.log(`Gemt ${rækker.length} tilbud OK`);
}

function findLabelVærdi($, label) {
  let værdi = null;
  $('*').each((_, el) => {
    const tekst = $(el).text().trim();
    if (tekst === label) {
      const næste = $(el).next();
      if (næste.length) { const k = næste.text().trim(); if (k) { værdi = k; return false; } }
      const søskende = $(el).parent().next();
      if (søskende.length) { const k = søskende.text().trim(); if (k) { værdi = k; return false; } }
    }
  });
  return værdi;
}

function parseDetalje(html, tilbudsid, afdelingsid) {
  const $ = load(html);
  const bodyTekst = $('body').text();

  let cvr = null;
  $('h4.h5, dt, th, strong, b').each((_, el) => {
    if ($(el).text().includes('CVR')) {
      const kandidat = $(el).next().text().trim() || $(el).parent().next().text().trim();
      const m = kandidat.match(/\d{8}/);
      if (m) { cvr = m[0]; return false; }
    }
  });
  if (!cvr) { const m = bodyTekst.match(/CVR[^0-9]*(\d{8})/i); if (m) cvr = m[1]; }

  let pNummer = null;
  const pMatch = bodyTekst.match(/P-nummer[^0-9]*(\d{10})/i);
  if (pMatch) pNummer = pMatch[1];

  let tilbudstype = null;
  $('h3.h5, h3, h4').each((_, el) => {
    const tekst = $(el).text().trim();
    if (tekst.match(/§\s*10[0-9]/) && !tilbudstype) tilbudstype = tekst;
  });

  let pladser = null;
  let pladsTotal = 0;
  $('#pladser').find('div.lh-1').each((_, el) => {
    const m = $(el).find('div').first().text().match(/(\d+)/);
    if (m) pladsTotal += parseInt(m[1], 10);
  });
  if (pladsTotal > 0 && pladsTotal < 2000) {
    pladser = pladsTotal;
  } else {
    const m = bodyTekst.match(/(\d+)\s+pladser/i);
    if (m) { const p = parseInt(m[1], 10); if (!isNaN(p) && p > 0 && p < 1000) pladser = p; }
  }

  let kommune = null;
  const kommuneMatch = bodyTekst.match(/Driftsaftale med\s*\n?\s*([^\n]+)/i);
  if (kommuneMatch) kommune = kommuneMatch[1].trim() || null;

  let email = null;
  $('a[href^="mailto:"]').each((_, el) => { if (!email) email = $(el).attr('href')?.replace('mailto:', '').trim() ?? null; });
  if (!email) { const m = bodyTekst.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/); if (m) email = m[0]; }

  let telefon = null;
  const telMatch = bodyTekst.match(/(?:Telefon|Tlf\.?)[:\s]*([0-9\s]{8,11})/i);
  if (telMatch) telefon = telMatch[1].replace(/\s/g, '').substring(0, 8) || null;

  const kontaktperson = findLabelVærdi($, 'Kontaktperson');
  const driftsform = findLabelVærdi($, 'Virksomhedsform');
  const leder = findLabelVærdi($, 'Tilbuddets leder');
  const virksomhedsNavn = findLabelVærdi($, 'Virksomhedens navn');
  const tilsynsmyndighed = findLabelVærdi($, 'Tilsynsførende myndighed');
  const website = $('div.hjemmesideOeverigeOplysninger a').first().attr('href') ?? null;

  let tilbuddetsAdresse = null;
  $('h4').each((_, el) => {
    if ($(el).text().trim() === 'Tilbuddets adresse') {
      const linjer = $(el).next('div').text().split('\n').map((l) => l.trim()).filter(Boolean);
      if (linjer.length) tilbuddetsAdresse = linjer.join(', ');
      return false;
    }
  });

  const pladsePoster = [];
  $('#pladser').find('div.lh-1').each((_, el) => {
    const paragraf = $(el).find('h3').text().match(/§\s*(\d+\w*)/i);
    const antal = $(el).find('div').first().text().match(/(\d+)\s+pladser/i);
    if (paragraf && antal) pladsePoster.push(`${antal[1]} §${paragraf[1]}`);
  });

  return {
    tilbudsid, afdelingsid, cvr, tilbudstype, pladser, pNummer: pNummer, kommune,
    kontaktperson: kontaktperson && kontaktperson.length <= 60 ? kontaktperson : null,
    telefon, email, driftsform,
    tilbuddetsAdresse,
    leder: leder && leder.length <= 80 ? leder : null,
    website, virksomhedsNavn, tilsynsmyndighed,
    pladsePrParagraf: pladsePoster.length ? pladsePoster.join(', ') : null,
  };
}

async function scraperDetaljer(batch = 50) {
  console.log(`Starter detaljer-scraping (batch=${batch})...`);

  const { data: rækker, error } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('id, tilbudsid, afdelingsid, tilbudsportalen_url, navn')
    .eq('detaljer_hentet', false)
    .limit(batch);

  if (error) throw new Error(`Supabase fejl: ${error.message}`);
  if (!rækker?.length) { console.log('Ingen ubehandlede tilbud'); return; }

  console.log(`Behandler ${rækker.length} tilbud...`);
  let behandlet = 0;
  let fejl = 0;

  for (let i = 0; i < rækker.length; i++) {
    const { tilbudsid, afdelingsid, tilbudsportalen_url, navn } = rækker[i];
    try {
      const res = await client.get(tilbudsportalen_url, { responseType: 'text' });
      const detalje = parseDetalje(res.data, tilbudsid, afdelingsid);
      await supabase.from('tilbudsportalen_tilbud').update({
        cvr: detalje.cvr, tilbudstype: detalje.tilbudstype, pladser: detalje.pladser,
        p_nummer: detalje.pNummer, kommune: detalje.kommune, kontaktperson: detalje.kontaktperson,
        telefon: detalje.telefon, email: detalje.email, driftsform: detalje.driftsform,
        tilbuddets_adresse: detalje.tilbuddetsAdresse, leder: detalje.leder,
        website: detalje.website, virksomheds_navn: detalje.virksomhedsNavn,
        tilsynsmyndighed: detalje.tilsynsmyndighed, pladser_pr_paragraf: detalje.pladsePrParagraf,
        detaljer_hentet: true,
      }).eq('tilbudsid', tilbudsid).eq('afdelingsid', afdelingsid);
      behandlet++;
      process.stdout.write(`\r  ${behandlet + fejl}/${rækker.length} — ${navn.substring(0, 40)}`);
    } catch (err) {
      fejl++;
      console.error(`\nFejl (${navn}): ${err.message}`);
      await supabase.from('tilbudsportalen_tilbud')
        .update({ detaljer_hentet: true })
        .eq('tilbudsid', tilbudsid).eq('afdelingsid', afdelingsid);
    }
    if (i < rækker.length - 1) await venteMs(TP_DELAY_MS);
  }

  console.log(`\nFærdig: ${behandlet} OK, ${fejl} fejl`);
}

// Main
const kommando = process.argv[2] ?? 'begge';
try {
  if (kommando === 'liste') {
    await scraperListe();
  } else if (kommando === 'detaljer') {
    await scraperDetaljer(100);
  } else {
    await scraperListe();
    await scraperDetaljer(200);
  }
  console.log('Done ✓');
} catch (err) {
  console.error('Kritisk fejl:', err.message);
  process.exit(1);
}
