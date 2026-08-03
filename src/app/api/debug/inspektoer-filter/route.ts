// src/app/api/debug/inspektoer-filter/route.ts
// Viser hvad erPersonNavn-filteret smider væk fra tilsyn_deltagere_stps

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

const BOSTED_SUFFIKSER = [
  'hjemmet', 'hjemme', 'hjem', 'center', 'centret', 'centeret',
  'kollegiet', 'kollegium', 'tilbuddet', 'tilbuddene', 'tilbud',
  'stedet', 'sted', 'huset', 'husene', 'huserne', 'gården', 'gaard', 'gård',
  'hjemsted', 'bofællesskab', 'bofælles', 'boform', 'bolig', 'bosted',
  'botilbud', 'boenhed', 'boenheden', 'institution', 'institutionen',
  'behandling', 'behandlings', 'ungdoms', 'børne', 'omsorg', 'omsorgs',
  'skolehjem', 'bostøtte', 'forsorgshjem', 'forsorgs', 'socialpsykia',
  'enhed', 'enheden', 'bakken', 'pensionat', 'pensionatet',
];

const BOSTED_HELE_ORD = new Set([
  'opholdssted', 'opholdsstedet', 'opholdsted', 'herberg', 'herberget',
  'fonden', 'foreningen', 'kvarter', 'kvarteret', 'selvejende', 'inst',
  'døgn', 'sporet', 'villa', 'lector', 'solutio', 'care', 'nord-bo',
  'nordbo', 'verden', 'vej', 'gade', 'alle', 'boulevard', 'stræde',
  'plads', 'omsorg', 'hus', 'have', 'haven', 'bakken',
]);

function erPersonNavn(navn: string): boolean {
  const n = navn.toLowerCase().trim();
  const ord = navn.trim().split(/\s+/);
  if (ord.length < 2) return false;
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[0])) return false;
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[1])) return false;
  if (ord.length > 4) return false;
  for (const o of ord) {
    if (o.length > 2 && /[A-ZÆØÅ]/.test(o.slice(1))) return false;
  }
  for (const o of ord) {
    const ol = o.toLowerCase().replace(/[^a-zæøå]/g, '');
    if (BOSTED_HELE_ORD.has(ol)) return false;
    if (BOSTED_SUFFIKSER.some((s) => ol.includes(s))) return false;
  }
  if (/\b(bolig|bofæl|botilbud|bosted|behandling|omsorg|selvejende|ungdoms|forsorg|socialpsykia)\b/.test(n)) return false;
  return true;
}

function afvisÅrsag(navn: string): string {
  const n = navn.toLowerCase().trim();
  const ord = navn.trim().split(/\s+/);
  if (ord.length < 2) return 'for_få_ord';
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[0])) return `ugyldigt_tegn_ord1: "${ord[0]}"`;
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[1])) return `ugyldigt_tegn_ord2: "${ord[1]}"`;
  if (ord.length > 4) return 'for_mange_ord';
  for (const o of ord) {
    if (o.length > 2 && /[A-ZÆØÅ]/.test(o.slice(1))) return `midterkapital: "${o}"`;
  }
  for (const o of ord) {
    const ol = o.toLowerCase().replace(/[^a-zæøå]/g, '');
    if (BOSTED_HELE_ORD.has(ol)) return `hele_ord_match: "${ol}"`;
    const hit = BOSTED_SUFFIKSER.find((s) => ol.includes(s));
    if (hit) return `suffiks_match: "${hit}" i "${ol}"`;
  }
  if (/\b(bolig|bofæl|botilbud|bosted|behandling|omsorg|selvejende|ungdoms|forsorg|socialpsykia)\b/.test(n)) return 'regex_match';
  return 'ukendt';
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, tilsyn_deltagere_stps')
    .not('tilsyn_deltagere_stps', 'is', null);

  if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 });

  type Deltager = { navn: string; titel: string | null };
  type Row = { id: string; stps_tilbud_navn: string; tilsyn_deltagere_stps: Deltager[] };

  // Tæl alle navne der filtreres væk — gruppér efter årsag
  const frasorteretMap = new Map<string, { navn: string; titel: string | null; årsag: string; antal: number; eksBosted: string }>();
  const godkendtSet = new Set<string>();
  let totalDeltagere = 0;
  let totalGodkendt = 0;
  let totalFravalgt = 0;

  for (const r of data as Row[]) {
    for (const d of r.tilsyn_deltagere_stps ?? []) {
      totalDeltagere++;
      const nøgle = d.navn.toLowerCase().trim();
      if (erPersonNavn(d.navn)) {
        totalGodkendt++;
        godkendtSet.add(nøgle);
      } else {
        totalFravalgt++;
        if (!frasorteretMap.has(nøgle)) {
          frasorteretMap.set(nøgle, {
            navn: d.navn,
            titel: d.titel,
            årsag: afvisÅrsag(d.navn),
            antal: 1,
            eksBosted: r.stps_tilbud_navn,
          });
        } else {
          frasorteretMap.get(nøgle)!.antal++;
        }
      }
    }
  }

  // Sorter frasorterede efter antal (hyppigst øverst)
  const frasorteret = [...frasorteretMap.values()]
    .sort((a, b) => b.antal - a.antal);

  // Grupper årsager
  const årsagTæller = new Map<string, number>();
  for (const f of frasorteret) {
    const årsagGruppe = f.årsag.split(':')[0];
    årsagTæller.set(årsagGruppe, (årsagTæller.get(årsagGruppe) ?? 0) + f.antal);
  }

  return NextResponse.json({
    resumé: {
      totalDeltagere,
      totalGodkendt,
      totalFravalgt,
      unikkeGodkendte: godkendtSet.size,
      unikeFrasorterede: frasorteret.length,
    },
    årsagFordeling: Object.fromEntries([...årsagTæller.entries()].sort((a, b) => b[1] - a[1])),
    frasorteret: frasorteret.slice(0, 100),
  });
}
