// src/features/monday/services/MondayProdukterService/mondayProdukterService.ts

import { mondayQuery } from '@/lib/api/MondayClient';

export type ProduktLinje = {
  produkt: string;
  antal: number;
  bostedNavne: string[];
};

export type ProdukterResultat = {
  linjer: ProduktLinje[];
  totalBosteder: number;
  hentetMs: number;
};

type SubitemKolonne = { text: string | null; column: { title: string } };
type RåSubitem = { name: string; column_values: SubitemKolonne[] };
type RåItem = { name: string; subitems: RåSubitem[] };
type BoardData = { boards: Array<{ items_page: { cursor: string | null; items: RåItem[] } }> };
type NextPage = { next_items_page: { cursor: string | null; items: RåItem[] } };

const SUBITEM_QUERY = (boardId: string) => `
  query {
    boards(ids: ["${boardId}"]) {
      items_page(limit: 200) {
        cursor
        items {
          name
          subitems {
            name
            column_values { text column { title } }
          }
        }
      }
    }
  }
`;

const NEXT_PAGE_QUERY = (cursor: string) => `
  query {
    next_items_page(cursor: "${cursor}", limit: 200) {
      cursor
      items {
        name
        subitems {
          name
          column_values { text column { title } }
        }
      }
    }
  }
`;

function udtraekProdukt(subitem: RåSubitem): string | null {
  const col = subitem.column_values.find(
    (cv) => cv.column.title.toLowerCase() === 'produkt',
  );
  return col?.text?.trim() || null;
}

export async function hentProduktStatistik(): Promise<ProdukterResultat> {
  const boardId = process.env.MONDAY_BOARD_ID;
  if (!boardId) throw new Error('MONDAY_BOARD_ID mangler');

  const start = Date.now();
  const alleItems: RåItem[] = [];

  const side1 = await mondayQuery<BoardData>(SUBITEM_QUERY(boardId));
  const page1 = side1.boards[0]?.items_page;
  alleItems.push(...(page1?.items ?? []));

  let cursor = page1?.cursor ?? null;
  while (cursor) {
    const næste = await mondayQuery<NextPage>(NEXT_PAGE_QUERY(cursor));
    alleItems.push(...(næste.next_items_page?.items ?? []));
    cursor = næste.next_items_page?.cursor ?? null;
  }

  // Tæl produkter
  const map = new Map<string, Set<string>>();

  for (const item of alleItems) {
    const seeneProdukter = new Set<string>();
    for (const subitem of item.subitems ?? []) {
      const produkt = udtraekProdukt(subitem);
      if (!produkt || seeneProdukter.has(produkt)) continue;
      seeneProdukter.add(produkt);

      if (!map.has(produkt)) map.set(produkt, new Set());
      map.get(produkt)!.add(item.name);
    }
  }

  const linjer: ProduktLinje[] = Array.from(map.entries())
    .map(([produkt, navne]) => ({
      produkt,
      antal: navne.size,
      bostedNavne: Array.from(navne).sort(),
    }))
    .sort((a, b) => b.antal - a.antal);

  const totalBosteder = new Set(alleItems.filter((i) => i.subitems?.length > 0).map((i) => i.name)).size;

  return { linjer, totalBosteder, hentetMs: Date.now() - start };
}
