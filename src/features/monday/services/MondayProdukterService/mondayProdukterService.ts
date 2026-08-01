// src/features/monday/services/MondayProdukterService/mondayProdukterService.ts

import { mondayQuery } from '@/lib/api/MondayClient';

export type ProduktPris = {
  pris: number;
  type: 'engangspris' | 'månedlig';
};

export const PRODUKT_PRISER: Record<string, ProduktPris> = {
  'Medicinkursus':                    { pris: 9995,  type: 'engangspris' },
  'Dokumentationskursus':             { pris: 9995,  type: 'engangspris' },
  'Minitilsyn':                       { pris: 8995,  type: 'engangspris' },
  'Instrukser':                       { pris: 8995,  type: 'engangspris' },
  'Brand- og førstehjælpskursus':     { pris: 9995,  type: 'engangspris' },
  'brand- og førstehjælpskursus':     { pris: 9995,  type: 'engangspris' },
  'Basispakke':                       { pris: 1895,  type: 'månedlig' },
};

export type BostedOptagelse = {
  navn: string;
  dato: string | null;
};

export type ProduktLinje = {
  produkt: string;
  antal: number;
  bostedNavne: string[];           // bagudkompatibilitet
  bosteder: BostedOptagelse[];
  pris: number | null;
  prisType: 'engangspris' | 'månedlig' | null;
  omsætning: number | null;
};

export type ProdukterResultat = {
  linjer: ProduktLinje[];
  totalBosteder: number;
  totalEngangsomsætning: number;
  totalMrr: number;
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

function udtraekDato(subitem: RåSubitem): string | null {
  const datoKol = subitem.column_values.find((cv) => {
    const titel = cv.column.title.toLowerCase();
    return (
      titel.includes('dato') ||
      titel.includes('start') ||
      titel.includes('oprettet') ||
      titel.includes('created')
    );
  });
  return datoKol?.text?.trim() || null;
}

export type KundePakke = {
  navn: string;
  startdato: string | null;
  farve: string;
  tekstFarve: string;
};

export const PRODUKT_FARVER: Record<string, { baggrund: string; tekst: string }> = {
  'Stor pakke':              { baggrund: '#0073ea', tekst: '#fff' },
  'FMK pakke':               { baggrund: '#66ccff', tekst: '#1a1a2e' },
  'Basispakke':              { baggrund: '#00ca72', tekst: '#fff' },
  'Mellempakke':             { baggrund: '#579bfc', tekst: '#fff' },
  'Medicinkursus':           { baggrund: '#7bcf7b', tekst: '#fff' },
  'Dokumentationskursus':    { baggrund: '#a25ddc', tekst: '#fff' },
  'Minitilsyn':              { baggrund: '#ff7575', tekst: '#fff' },
  'Instrukser':              { baggrund: '#13bfb2', tekst: '#fff' },
  'Brand- og førstehjælpskursus': { baggrund: '#fdab3d', tekst: '#fff' },
};

function produkt_farve(produkt: string): { baggrund: string; tekst: string } {
  return PRODUKT_FARVER[produkt] ?? { baggrund: '#c4c4c4', tekst: '#333' };
}

export async function hentKundePakker(mondayItemId: string): Promise<KundePakke[]> {
  type SubKol = { text: string | null; column: { title: string } };
  type SubItem = { name: string; column_values: SubKol[] };
  type Res = { items: Array<{ subitems: SubItem[] }> };

  const data = await mondayQuery<Res>(`
    query {
      items(ids: ["${mondayItemId}"]) {
        subitems {
          name
          column_values { text column { title } }
        }
      }
    }
  `);

  const subitems = data.items[0]?.subitems ?? [];
  return subitems.map((sub) => {
    const produkt = sub.column_values.find(
      (cv) => cv.column.title.toLowerCase() === 'produkt',
    )?.text?.trim() ?? sub.name;

    const dato = sub.column_values.find((cv) => {
      const t = cv.column.title.toLowerCase();
      return t.includes('dato') || t.includes('start');
    })?.text?.trim() ?? null;

    const { baggrund, tekst } = produkt_farve(produkt);
    return { navn: produkt, startdato: dato, farve: baggrund, tekstFarve: tekst };
  });
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

  // Byg map: produkt → Map<bostedNavn, dato>
  const map = new Map<string, Map<string, string | null>>();

  for (const item of alleItems) {
    const seeneProdukter = new Set<string>();
    for (const subitem of item.subitems ?? []) {
      const produkt = udtraekProdukt(subitem);
      if (!produkt || seeneProdukter.has(produkt)) continue;
      seeneProdukter.add(produkt);

      const dato = udtraekDato(subitem);
      if (!map.has(produkt)) map.set(produkt, new Map());
      map.get(produkt)!.set(item.name, dato);
    }
  }

  let totalEngangsomsætning = 0;
  let totalMrr = 0;

  const linjer: ProduktLinje[] = Array.from(map.entries())
    .map(([produkt, bostedMap]) => {
      const bosteder: BostedOptagelse[] = Array.from(bostedMap.entries())
        .map(([navn, dato]) => ({ navn, dato }))
        .sort((a, b) => {
          if (a.dato && b.dato) return b.dato.localeCompare(a.dato);
          return a.navn.localeCompare(b.navn);
        });

      const prisInfo = PRODUKT_PRISER[produkt] ?? null;
      const antal = bosteder.length;
      const omsætning = prisInfo ? prisInfo.pris * antal : null;

      if (prisInfo?.type === 'engangspris' && omsætning) totalEngangsomsætning += omsætning;
      if (prisInfo?.type === 'månedlig' && omsætning) totalMrr += omsætning;

      return {
        produkt,
        antal,
        bostedNavne: bosteder.map((b) => b.navn),
        bosteder,
        pris: prisInfo?.pris ?? null,
        prisType: prisInfo?.type ?? null,
        omsætning,
      };
    })
    .sort((a, b) => (b.omsætning ?? 0) - (a.omsætning ?? 0));

  const totalBosteder = new Set(
    alleItems.filter((i) => i.subitems?.length > 0).map((i) => i.name),
  ).size;

  return {
    linjer,
    totalBosteder,
    totalEngangsomsætning,
    totalMrr,
    hentetMs: Date.now() - start,
  };
}
