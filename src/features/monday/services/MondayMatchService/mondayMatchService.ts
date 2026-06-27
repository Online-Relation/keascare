// src/features/monday/services/MondayMatchService/mondayMatchService.ts

import { mondayQuery } from '@/lib/api/MondayClient';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { MondayKundeItem, MondayMatchResultat, MondayGruppe } from '@/features/monday/types/monday.types';

const BOARD_ID = process.env.MONDAY_BOARD_ID;

// Gruppenavne der betragtes som aktive kunder
const AKTIVE_GRUPPE_NAVNE = ['nye forløb', 'aktive forløb'];

type RåMondayItem = {
  id: string;
  name: string;
  group: { id: string; title: string };
  column_values: Array<{ id: string; text: string | null; type: string; column: { title: string } }>;
};

type ItemsPage = {
  boards: Array<{
    items_page: { cursor: string | null; items: RåMondayItem[] };
  }>;
};

type NextPage = {
  next_items_page: { cursor: string | null; items: RåMondayItem[] };
};

function normaliserNavn(navn: string): string {
  return navn
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,\-–]/g, '')
    .trim();
}

function mapGruppe(gruppeNavn: string): MondayGruppe {
  const norm = gruppeNavn.toLowerCase();
  if (norm.includes('nye')) return 'nye_forloeb';
  if (norm.includes('aktive')) return 'aktive_forloeb';
  return 'ukendt';
}

function findKolonneVærdi(item: RåMondayItem, kolonneTitel: string): string | null {
  const felt = item.column_values.find(
    (cv) => cv.column.title.toLowerCase().includes(kolonneTitel.toLowerCase())
  );
  return felt?.text ?? null;
}

async function hentAlleMondayBostedItems(): Promise<RåMondayItem[]> {
  if (!BOARD_ID) throw new Error('MONDAY_BOARD_ID mangler');

  const side1 = await mondayQuery<ItemsPage>(`
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 500) {
          cursor
          items {
            id name
            group { id title }
            column_values { id text type column { title } }
          }
        }
      }
    }
  `, { boardId: BOARD_ID });

  let items = side1.boards[0]?.items_page.items ?? [];
  let cursor = side1.boards[0]?.items_page.cursor;

  while (cursor) {
    const næste = await mondayQuery<NextPage>(`
      query ($cursor: String!) {
        next_items_page(limit: 500, cursor: $cursor) {
          cursor
          items {
            id name
            group { id title }
            column_values { id text type column { title } }
          }
        }
      }
    `, { cursor });
    items = [...items, ...(næste.next_items_page.items ?? [])];
    cursor = næste.next_items_page.cursor;
  }

  // Filtrer: kun Type=Bosted og kun aktive grupper
  return items.filter((item) => {
    const type = findKolonneVærdi(item, 'Type')?.toLowerCase();
    if (type !== 'bosted') return false;
    const gruppeNorm = item.group.title.toLowerCase();
    return AKTIVE_GRUPPE_NAVNE.some((g) => gruppeNorm === g);
  });
}

function mapTilKundeItem(item: RåMondayItem): MondayKundeItem {
  return {
    mondayId:    item.id,
    navn:        item.name,
    gruppe:      mapGruppe(item.group.title),
    gruppeNavn:  item.group.title,
    adresse:     findKolonneVærdi(item, 'Forløb Adresse'),
    email:       findKolonneVærdi(item, 'Kontakt Mail'),
    website:     findKolonneVærdi(item, 'Forløb Website'),
    oprettetDato: findKolonneVærdi(item, 'Oprettelsesdato'),
  };
}

type StpsRapport = {
  id: string;
  stps_tilbud_navn: string | null;
  tp_adresse: string | null;
};

function findStpsMatch(
  kundeItem: MondayKundeItem,
  rapporter: StpsRapport[],
  navnMap: Map<string, string>
): string | null {
  const normMondayNavn = normaliserNavn(kundeItem.navn);

  // Direkte navnematch
  if (navnMap.has(normMondayNavn)) return navnMap.get(normMondayNavn)!;

  // Prefix-match (Monday-navn starter med STPS-navn eller omvendt)
  for (const [normStpsNavn, id] of navnMap) {
    if (
      normMondayNavn.startsWith(normStpsNavn) ||
      normStpsNavn.startsWith(normMondayNavn)
    ) {
      return id;
    }
  }

  return null;
}

type TpTilbud = {
  id: string;
  navn: string | null;
  cvr: string | null;
};

function findNavn<T extends { id: string }>(
  mondayNavn: string,
  navnMap: Map<string, T>
): T | null {
  const norm = normaliserNavn(mondayNavn);
  if (navnMap.has(norm)) return navnMap.get(norm)!;
  for (const [key, val] of navnMap) {
    if (norm.startsWith(key) || key.startsWith(norm)) return val;
  }
  return null;
}

export async function kørMondayMatch(): Promise<MondayMatchResultat> {
  const supabase = getSupabaseServerClient();
  const nu = new Date().toISOString();

  // Hent Monday-kunder
  const mondayItems = await hentAlleMondayBostedItems();
  const kundeItems = mondayItems.map(mapTilKundeItem);

  // Hent STPS-rapporter
  const { data: stpsData, error: stpsFejl } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, tp_adresse, cvr');
  if (stpsFejl) throw new Error(`Supabase STPS fejl: ${stpsFejl.message}`);

  // Hent Tilbudsportalen-tilbud
  const { data: tpData, error: tpFejl } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('id, navn, cvr');
  if (tpFejl) throw new Error(`Supabase TP fejl: ${tpFejl.message}`);

  const stpsRapporter = (stpsData ?? []) as (StpsRapport & { cvr: string | null })[];
  const tpTilbud = (tpData ?? []) as TpTilbud[];

  // Byg navnemaps
  const stpsNavnMap = new Map<string, { id: string }>();
  for (const r of stpsRapporter) {
    if (r.stps_tilbud_navn) stpsNavnMap.set(normaliserNavn(r.stps_tilbud_navn), { id: r.id });
  }

  const tpNavnMap = new Map<string, TpTilbud>();
  for (const t of tpTilbud) {
    if (t.navn) tpNavnMap.set(normaliserNavn(t.navn), t);
  }

  // CVR-map: cvr → stps rapport id
  const stpsCvrMap = new Map<string, string>();
  for (const r of stpsRapporter) {
    if (r.cvr) stpsCvrMap.set(r.cvr.trim(), r.id);
  }

  // Nulstil eksisterende matches
  await supabase
    .from('stps_rapporter')
    .update({ monday_item_id: null, monday_gruppe: null, monday_match_dato: null })
    .not('monday_item_id', 'is', null);
  await supabase
    .from('tilbudsportalen_tilbud')
    .update({ monday_item_id: null, monday_gruppe: null, monday_match_dato: null })
    .not('monday_item_id', 'is', null);

  let matchetTilStps = 0;
  let matchetTilTp = 0;
  const ukendte: MondayKundeItem[] = [];

  for (const kunde of kundeItems) {
    const mondayData = {
      monday_item_id:    kunde.mondayId,
      monday_gruppe:     kunde.gruppe,
      monday_match_dato: nu,
    };

    // 1. Forsøg: match mod STPS på navn
    const stpsMatch = findNavn(kunde.navn, stpsNavnMap);
    if (stpsMatch) {
      await supabase.from('stps_rapporter').update(mondayData).eq('id', stpsMatch.id);
      matchetTilStps++;
      continue;
    }

    // 2. Forsøg: match mod Tilbudsportalen på navn
    const tpMatch = findNavn(kunde.navn, tpNavnMap);
    if (tpMatch) {
      // Hvis TP-tilbuddet har CVR der matcher en STPS-rapport, opdater den i stedet
      if (tpMatch.cvr) {
        const stpsViaCvr = stpsCvrMap.get(tpMatch.cvr.trim());
        if (stpsViaCvr) {
          await supabase.from('stps_rapporter').update(mondayData).eq('id', stpsViaCvr);
          matchetTilStps++;
          continue;
        }
      }
      // Ellers gem på Tilbudsportalen-rækken
      await supabase.from('tilbudsportalen_tilbud').update(mondayData).eq('id', tpMatch.id);
      matchetTilTp++;
      continue;
    }

    ukendte.push(kunde);
  }

  return {
    hentetFraMonday: kundeItems.length,
    matchetTilStps,
    matchetTilTp,
    ingenMatch: ukendte.length,
    ukendte,
  };
}

export async function hentMondayMatchStatus(): Promise<{
  matchede: number;
  ukendte: MondayKundeItem[];
  sidstKørt: string | null;
}> {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('stps_rapporter')
    .select('monday_item_id, monday_gruppe, monday_match_dato, stps_tilbud_navn')
    .not('monday_item_id', 'is', null);

  const matchede = (data ?? []).length;
  const sidstKørt = (data ?? [])
    .map((r: { monday_match_dato: string | null }) => r.monday_match_dato)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  return { matchede, ukendte: [], sidstKørt };
}
