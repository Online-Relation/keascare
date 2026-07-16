import { mondayQuery } from '@/lib/api/MondayClient';
import type { MondayKundeItem, MondayGruppe } from '@/features/monday/types/monday.types';

const BOARD_ID = process.env.MONDAY_BOARD_ID;
const AKTIVE_GRUPPE_NAVNE = ['nye forløb', 'aktive forløb'];
const AFSLUTTEDE_GRUPPE_NAVNE = ['afsluttede deals', 'tabte deals'];
const TABTE_GRUPPE_NAVNE = ['tabte', 'tabt'];

type Kolonne = { id: string; text: string | null; type: string; column: { title: string } };
type RåItem = { id: string; name: string; group: { id: string; title: string }; column_values: Kolonne[] };
type BoardMedGrupper = { boards: Array<{ groups: Array<{ id: string; title: string }> }> };
type GruppeItemsPage = { boards: Array<{ groups: Array<{ items_page: { cursor: string | null; items: RåItem[] } }> }> };
type NextPage = { next_items_page: { cursor: string | null; items: RåItem[] } };

function findKolonne(item: RåItem, titel: string): string | null {
  return item.column_values.find((cv) => cv.column.title.toLowerCase().includes(titel.toLowerCase()))?.text ?? null;
}

function mapGruppe(gruppeNavn: string): MondayGruppe {
  const norm = gruppeNavn.toLowerCase().trim();
  if (norm.includes('nye')) return 'nye_forloeb';
  if (norm.includes('aktive')) return 'aktive_forloeb';
  // Tabt tjekkes FØR afsluttet — "tabte kunder" skal ikke ende som afsluttet
  if (norm.includes('tabt')) return 'tabt';
  if (norm.includes('afsluttede')) return 'afsluttet_forloeb';
  return 'ukendt';
}

function mapItem(item: RåItem): MondayKundeItem {
  return {
    mondayId:         item.id,
    navn:             item.name,
    gruppe:           mapGruppe(item.group.title),
    gruppeNavn:       item.group.title,
    cvr:              null,
    adresse:          findKolonne(item, 'Forløb Adresse'),
    email:            findKolonne(item, 'Kontakt Mail'),
    website:          findKolonne(item, 'Forløb Website'),
    oprettetDato:     findKolonne(item, 'Oprettelsesdato'),
    forløbsansvarlig: findKolonne(item, 'Forløbsansvarlig'),
    opfølgningsdato:  findKolonne(item, 'Opfølgningsdato'),
    afsluttetDato:    findKolonne(item, 'Last updated'),
    status:           findKolonne(item, 'Status'),
  };
}

export async function hentAlleMondayKunder(): Promise<MondayKundeItem[]> {
  if (!BOARD_ID) throw new Error('MONDAY_BOARD_ID mangler');

  const gruppeData = await mondayQuery<BoardMedGrupper>(`
    query ($boardId: ID!) {
      boards(ids: [$boardId]) { groups { id title } }
    }
  `, { boardId: BOARD_ID });

  const alleGrupper = gruppeData.boards[0]?.groups ?? [];

  const relevanteIds = alleGrupper
    .filter((g) => {
      const norm = g.title.toLowerCase().trim();
      return (
        AKTIVE_GRUPPE_NAVNE.some((navn) => norm === navn) ||
        AFSLUTTEDE_GRUPPE_NAVNE.some((navn) => norm.includes(navn)) ||
        norm.includes('tabt')
      );
    })
    .map((g) => g.id);

  if (relevanteIds.length === 0) return [];

  const gruppeIdStr = relevanteIds.map((id) => `"${id}"`).join(', ');

  const side1 = await mondayQuery<GruppeItemsPage>(`
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        groups(ids: [${gruppeIdStr}]) {
          items_page(limit: 500) {
            cursor
            items { id name group { id title } column_values { id text type column { title } } }
          }
        }
      }
    }
  `, { boardId: BOARD_ID });

  const grupper = side1.boards[0]?.groups ?? [];
  let råItems: RåItem[] = grupper.flatMap((g) => g.items_page.items);
  const cursors = grupper.map((g) => g.items_page.cursor).filter((c): c is string => !!c);

  for (const cursor of cursors) {
    const næste = await mondayQuery<NextPage>(`
      query ($cursor: String!) {
        next_items_page(limit: 500, cursor: $cursor) {
          cursor
          items { id name group { id title } column_values { id text type column { title } } }
        }
      }
    `, { cursor });
    råItems = [...råItems, ...(næste.next_items_page.items ?? [])];
  }

  return råItems
    .filter((item) => {
      const type = findKolonne(item, 'Type')?.toLowerCase();
      const gruppe = mapGruppe(item.group.title);
      // Tabte items inkluderes selv om Type ikke er sat
      return type === 'bosted' || gruppe === 'tabt';
    })
    .map(mapItem);
}
