// src/app/dashboard/monday-test/page.tsx

import { mondayQuery } from '@/lib/api/MondayClient';
import { AlertCircle, CheckCircle, Hash, Columns, Layout, Users } from 'lucide-react';

const BOARD_ID = process.env.MONDAY_BOARD_ID;

type MondayKolonne = { id: string; title: string; type: string };
type MondayGruppe  = { id: string; title: string; color: string };
type MondayItem = {
  id: string;
  name: string;
  group: { id: string; title: string };
  column_values: Array<{ id: string; text: string | null; type: string; column: { title: string } }>;
};

type BoardMeta = {
  boards: Array<{
    name: string;
    items_count: number;
    groups: MondayGruppe[];
    columns: MondayKolonne[];
  }>;
};

type ItemsPage = {
  boards: Array<{
    items_page: { cursor: string | null; items: MondayItem[] };
  }>;
};

type NextPage = {
  next_items_page: { cursor: string | null; items: MondayItem[] };
};

async function hentAlleItems(): Promise<{ board: BoardMeta['boards'][0]; items: MondayItem[] } | null> {
  if (!BOARD_ID) return null;

  try {
    // Hent board-meta og første side
    const [meta, side1] = await Promise.all([
      mondayQuery<BoardMeta>(`
        query ($boardId: ID!) {
          boards(ids: [$boardId]) {
            name
            items_count
            groups { id title color }
            columns { id title type }
          }
        }
      `, { boardId: BOARD_ID }),

      mondayQuery<ItemsPage>(`
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
      `, { boardId: BOARD_ID }),
    ]);

    const board = meta.boards[0];
    if (!board) return null;

    let items = side1.boards[0]?.items_page.items ?? [];
    let cursor = side1.boards[0]?.items_page.cursor;

    // Hent resterende sider
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

    return { board, items };
  } catch {
    return null;
  }
}

const KOLONNE_FARVER: Record<string, string> = {
  text:      '#6366F1', status:    '#10B981', date:      '#F59E0B',
  people:    '#EC4899', numbers:   '#3B82F6', email:     '#8B5CF6',
  phone:     '#14B8A6', long_text: '#6B7280', link:      '#0EA5E9',
  dropdown:  '#F97316', checkbox:  '#84CC16', color:     '#F43F5E',
};

function findTypeVærdi(item: MondayItem): string | null {
  const felt = item.column_values.find(
    (cv) => cv.column.title.toLowerCase().includes('type')
  );
  return felt?.text ?? null;
}

export default async function MondayTestSide() {
  const resultat = await hentAlleItems();

  if (!resultat) {
    return (
      <div className="dashboard-content">
        <div className="mon-fejl">
          <AlertCircle size={20} />
          <div>
            <strong>Kunne ikke hente Monday-data</strong>
            <p>Tjek at MONDAY_API_KEY og MONDAY_BOARD_ID er sat korrekt.</p>
          </div>
        </div>
      </div>
    );
  }

  const { board, items } = resultat;

  // Opdel på type
  const bostedItems      = items.filter((i) => findTypeVærdi(i)?.toLowerCase() === 'bosted');
  const privatItems      = items.filter((i) => findTypeVærdi(i)?.toLowerCase().includes('privat'));
  const udenTypeItems    = items.filter((i) => !findTypeVærdi(i));
  const øvrigeItems      = items.filter((i) => {
    const v = findTypeVærdi(i)?.toLowerCase() ?? '';
    return v && v !== 'bosted' && !v.includes('privat');
  });

  // Antal pr. gruppe — kun bosted-items
  const gruppeMap = new Map<string, { titel: string; farve: string; antal: number }>();
  for (const g of board.groups) {
    gruppeMap.set(g.id, { titel: g.title, farve: g.color, antal: 0 });
  }
  for (const item of bostedItems) {
    const g = gruppeMap.get(item.group.id);
    if (g) g.antal++;
  }

  // Unikke type-værdier i boardet
  const typeVærdier = new Map<string, number>();
  for (const item of items) {
    const v = findTypeVærdi(item) ?? '(ingen)';
    typeVærdier.set(v, (typeVærdier.get(v) ?? 0) + 1);
  }

  return (
    <div className="dashboard-content">

      <div className="mon-header">
        <div>
          <h1 className="mon-titel">Monday — Datatest</h1>
          <p className="mon-undertitel">Kun læsning · Board: <strong>{board.name}</strong></p>
        </div>
        <span className="mon-ok-badge">
          <CheckCircle size={13} />
          Forbundet
        </span>
      </div>

      {/* Overordnede tal */}
      <div className="mon-kpi-grid">
        <div className="mon-kpi">
          <Hash size={18} className="mon-kpi-ikon" />
          <div>
            <div className="mon-kpi-tal">{items.length}</div>
            <div className="mon-kpi-label">Items i alt</div>
          </div>
        </div>
        <div className="mon-kpi">
          <Users size={18} className="mon-kpi-ikon" style={{ color: '#10B981' }} />
          <div>
            <div className="mon-kpi-tal">{bostedItems.length}</div>
            <div className="mon-kpi-label">Type: Bosted</div>
          </div>
        </div>
        <div className="mon-kpi">
          <Users size={18} className="mon-kpi-ikon" style={{ color: '#EF4444' }} />
          <div>
            <div className="mon-kpi-tal">{privatItems.length}</div>
            <div className="mon-kpi-label">Type: Privatforløb</div>
          </div>
        </div>
        <div className="mon-kpi">
          <Layout size={18} className="mon-kpi-ikon" />
          <div>
            <div className="mon-kpi-tal">{board.groups.length}</div>
            <div className="mon-kpi-label">Grupper (pipeline)</div>
          </div>
        </div>
      </div>

      <div className="mon-grid">

        {/* Grupper med antal bosted-items */}
        <div className="mon-kort">
          <h2 className="mon-kort-titel">Antal bosteder pr. gruppe</h2>
          <div className="mon-gruppe-liste">
            {Array.from(gruppeMap.values())
              .sort((a, b) => b.antal - a.antal)
              .map((g) => (
                <div key={g.titel} className="mon-gruppe-række">
                  <span className="mon-gruppe-farve" style={{ background: g.farve }} />
                  <span className="mon-gruppe-navn">{g.titel}</span>
                  <span className="mon-gruppe-antal">{g.antal}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Type-fordeling + kolonner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Type-værdier */}
          <div className="mon-kort">
            <h2 className="mon-kort-titel">Alle type-værdier i boardet</h2>
            <div className="mon-gruppe-liste">
              {Array.from(typeVærdier.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([type, antal]) => (
                  <div key={type} className="mon-gruppe-række">
                    <span
                      className="mon-gruppe-farve"
                      style={{
                        background: type === '(ingen)' ? '#9CA3AF'
                          : type.toLowerCase() === 'bosted' ? '#10B981'
                          : type.toLowerCase().includes('privat') ? '#EF4444'
                          : '#6366F1',
                      }}
                    />
                    <span className="mon-gruppe-navn">{type}</span>
                    <span className="mon-gruppe-antal">{antal}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Kolonner */}
          <div className="mon-kort">
            <h2 className="mon-kort-titel">Kolonner og datatyper</h2>
            <div className="mon-kolonne-liste">
              {board.columns.map((k) => (
                <div key={k.id} className="mon-kolonne-række">
                  <span
                    className="mon-kolonne-type"
                    style={{ background: KOLONNE_FARVER[k.type] ?? '#9CA3AF' }}
                  >
                    {k.type}
                  </span>
                  <span className="mon-kolonne-navn">{k.title}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Eksempel på bosted-items */}
      <div className="mon-items-sektion">
        <h2 className="mon-kort-titel">Eksempel — de første 10 bosted-items</h2>
        <div className="mon-items-liste">
          {bostedItems.slice(0, 10).map((item) => {
            const udfyldte = item.column_values.filter((cv) => cv.text);
            return (
              <div key={item.id} className="mon-item-kort">
                <div className="mon-item-header">
                  <span className="mon-item-navn">{item.name}</span>
                  <span className="mon-item-gruppe">{item.group.title}</span>
                </div>
                <div className="mon-item-felter">
                  {udfyldte.map((cv) => (
                    <div key={cv.id} className="mon-item-felt">
                      <span className="mon-item-felt-label">{cv.column.title}</span>
                      <span className="mon-item-felt-værdi">{cv.text}</span>
                    </div>
                  ))}
                  {udfyldte.length === 0 && (
                    <span className="mon-item-tom">Ingen udfyldte felter</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
