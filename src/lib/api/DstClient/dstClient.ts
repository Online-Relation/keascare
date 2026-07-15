// src/lib/api/DstClient/dstClient.ts
// DST HAND01: §107/§108 borgere pr. kommune og pr. år

const DST_TABLEINFO = 'https://api.statbank.dk/v1/tableinfo/HAND01?lang=da';
const DST_DATA = 'https://api.statbank.dk/v1/data';

// FOLK1A: Folketal pr. 1. januar — hele landet, alle aldre, begge køn
const FOLK1A_OMRÅDE = '000'; // Hele landet

const YDELSE_107 = '30182'; // Midlertidige botilbud (§107)
const YDELSE_108 = '30181'; // Længerevarende botilbud (§108)

export type DstKommuneRå = {
  kommune: string;
  p107: number;
  p108: number;
  total: number;
  kvartal?: string;
};

// Læs fra Supabase-cache (foretrækkes på runtime)
export async function hentDstFraCache(): Promise<{ data: DstKommuneRå[]; kvartal: string | null; hentetKl: string | null }> {
  const { getSupabaseServerClient } = await import('@/lib/db/SupabaseClient');
  const supabase = getSupabaseServerClient();

  // Find seneste kvartal
  const { data: seneste } = await supabase
    .from('dst_borgere')
    .select('kvartal, hentet_kl')
    .order('hentet_kl', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!seneste) return { data: [], kvartal: null, hentetKl: null };

  const { data: rækker } = await supabase
    .from('dst_borgere')
    .select('kommune, p107, p108, total')
    .eq('kvartal', seneste.kvartal)
    .order('total', { ascending: false });

  return {
    data: (rækker ?? []).map((r) => ({ ...r, kvartal: seneste.kvartal })),
    kvartal: seneste.kvartal,
    hentetKl: seneste.hentet_kl,
  };
}

async function hentKommuneIds(): Promise<{ ids: string[]; senesteKvartal: string }> {
  const res = await fetch(DST_TABLEINFO, {
    next: { revalidate: 86400 },
  });
  const info = await res.json();
  const kommuneVar = info.variables[0];
  const tidVar = info.variables[info.variables.length - 1];
  const ids = kommuneVar.values.map((v: { id: string }) => v.id);
  const senesteKvartal = tidVar.values[tidVar.values.length - 1].id as string;
  return { ids, senesteKvartal };
}

export async function hentDstKommuneData(): Promise<DstKommuneRå[]> {
  const { ids, senesteKvartal } = await hentKommuneIds();
  // senesteKvartal sættes på hvert objekt så scraperen kan gemme det

  const payload = {
    table: 'HAND01',
    format: 'CSV',
    lang: 'da',
    variables: [
      { code: 'OMRÅDE', values: ids },
      { code: 'YDELSESTYPE', values: [YDELSE_107, YDELSE_108] },
      { code: 'Tid', values: [senesteKvartal] },
    ],
  };

  const res = await fetch(DST_DATA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`DST API fejl: ${res.status}`);
  }

  const csv = await res.text();
  return parseKommuneCsv(csv, senesteKvartal);
}

export type DstÅrTotal = {
  år: number;
  p107: number;
  p108: number;
  total: number;
  befolkning?: number;
  prTusind?: number;
};

export async function hentDstBefolkning(fraÅr = 2016): Promise<Map<number, number>> {
  const nuÅr = new Date().getFullYear();
  const år: string[] = [];
  for (let y = fraÅr; y <= nuÅr; y++) år.push(String(y));

  const payload = {
    table: 'FOLK1A',
    format: 'CSV',
    lang: 'da',
    variables: [
      { code: 'OMRÅDE', values: [FOLK1A_OMRÅDE] },
      { code: 'KØN', values: ['TOT'] },
      { code: 'ALDER', values: ['IALT'] },
      { code: 'Tid', values: år.map((y) => `${y}K1`) },
    ],
  };

  const res = await fetch(DST_DATA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
    next: { revalidate: 86400 },
  });

  const map = new Map<number, number>();
  if (!res.ok) return map;

  const csv = await res.text();
  const linjer = csv.replace(/^﻿/, '').trim().split('\n').slice(1);
  for (const linje of linjer) {
    const dele = linje.split(';');
    if (dele.length < 5) continue;
    const tid = dele[3].replace(/^"|"$/g, ''); // e.g. "2022K1"
    const antal = parseFloat(dele[4].replace(/^"|"$/g, '').replace(',', '.')) || 0;
    const y = parseInt(tid.split('K')[0]);
    if (y && antal) map.set(y, Math.round(antal));
  }
  return map;
}

export async function hentDstÅrligeData(fraÅr = 2016): Promise<DstÅrTotal[]> {
  const nuÅr = new Date().getFullYear();

  // Hent tilgængelige kvartaler fra DST, brug kun dem der faktisk eksisterer
  const { ids, senesteKvartal } = await hentKommuneIds();

  // Byg kun kvartaler op til og med seneste kendte kvartal fra DST
  const [senesteÅr, senesteQ] = senesteKvartal.split('K').map(Number);
  const kvartaler: string[] = [];
  for (let år = fraÅr; år <= nuÅr; år++) {
    const maxQ = år < senesteÅr ? 4 : år === senesteÅr ? senesteQ : 0;
    for (let q = 1; q <= maxQ; q++) {
      kvartaler.push(`${år}K${q}`);
    }
  }
  if (!kvartaler.length) return [];

  const payload = {
    table: 'HAND01',
    format: 'CSV',
    lang: 'da',
    variables: [
      { code: 'OMRÅDE', values: ids },
      { code: 'YDELSESTYPE', values: [YDELSE_107, YDELSE_108] },
      { code: 'Tid', values: kvartaler },
    ],
  };

  const res = await fetch(DST_DATA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
    next: { revalidate: 86400 },
  });

  if (!res.ok) throw new Error(`DST API fejl: ${res.status}`);

  const [csv, befolkningMap] = await Promise.all([
    res.text(),
    hentDstBefolkning(fraÅr).catch(() => new Map<number, number>()),
  ]);

  const rækker = parseÅrCsv(csv, fraÅr, nuÅr);
  return rækker.map((r) => {
    const bef = befolkningMap.get(r.år);
    return {
      ...r,
      befolkning: bef,
      prTusind: bef ? Math.round((r.total / bef) * 10000) / 10 : undefined,
    };
  });
}

function parseÅrCsv(csv: string, fraÅr: number, tilÅr: number): DstÅrTotal[] {
  const linjer = csv.replace(/^﻿/, '').trim().split('\n').slice(1);
  // kvartal → { p107, p108 }
  const kvartalMap = new Map<string, { p107: number; p108: number }>();

  for (const linje of linjer) {
    const dele = linje.split(';');
    if (dele.length < 4) continue;
    const ydelse = dele[1].replace(/^"|"$/g, '');
    const kvartal = dele[2].replace(/^"|"$/g, '');
    const antal = parseFloat(dele[3].replace(/^"|"$/g, '').replace(',', '.')) || 0;

    if (!kvartalMap.has(kvartal)) kvartalMap.set(kvartal, { p107: 0, p108: 0 });
    const entry = kvartalMap.get(kvartal)!;
    if (ydelse.includes('108')) entry.p108 += antal;
    else entry.p107 += antal;
  }

  const resultater: DstÅrTotal[] = [];
  for (let år = fraÅr; år <= tilÅr; år++) {
    // Foretruk Q4, ellers Q3, Q2, Q1
    const kandidat = [`${år}K4`, `${år}K3`, `${år}K2`, `${år}K1`].find((k) => kvartalMap.has(k));
    if (!kandidat) continue;
    const { p107, p108 } = kvartalMap.get(kandidat)!;
    resultater.push({ år, p107: Math.round(p107), p108: Math.round(p108), total: Math.round(p107 + p108) });
  }
  return resultater;
}

function parseKommuneCsv(csv: string, senesteKvartal: string): DstKommuneRå[] {
  const linjer = csv.replace(/^﻿/, '').trim().split('\n').slice(1);
  const map = new Map<string, { p107: number; p108: number }>();

  for (const linje of linjer) {
    const dele = linje.split(';');
    if (dele.length < 4) continue;
    const kommune = dele[0].replace(/^"|"$/g, '');
    const ydelse = dele[1].replace(/^"|"$/g, '');
    const antal = parseFloat(dele[3].replace(/^"|"$/g, '').replace(',', '.')) || 0;

    if (!map.has(kommune)) map.set(kommune, { p107: 0, p108: 0 });
    const entry = map.get(kommune)!;
    if (ydelse.includes('108')) {
      entry.p108 = antal;
    } else {
      entry.p107 = antal;
    }
  }

  return Array.from(map.entries())
    .map(([kommune, data]) => ({
      kommune,
      p107: Math.round(data.p107),
      p108: Math.round(data.p108),
      total: Math.round(data.p107 + data.p108),
      kvartal: senesteKvartal,
    }))
    .sort((a, b) => b.total - a.total);
}
