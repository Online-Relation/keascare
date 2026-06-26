// src/lib/api/DstClient/dstClient.ts

const DST_TABLEINFO = 'https://api.statbank.dk/v1/tableinfo/HAND01?lang=da';
const DST_DATA = 'https://api.statbank.dk/v1/data';

const YDELSE_107 = '30182'; // Midlertidige botilbud (§107)
const YDELSE_108 = '30181'; // Længerevarende botilbud (§108)

export type DstKommuneRå = {
  kommune: string;
  p107: number;
  p108: number;
  total: number;
};

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
  return parseKommuneCsv(csv);
}

function parseKommuneCsv(csv: string): DstKommuneRå[] {
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
    }))
    .sort((a, b) => b.total - a.total);
}
