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

type BoardData = {
  boards: Array<{
    name: string;
    description: string | null;
    items_count: number;
    groups: MondayGruppe[];
    columns: MondayKolonne[];
    items_page: { items: MondayItem[] };
  }>;
};

async function hentBoardData() {
  if (!BOARD_ID) return null;
  try {
    return await mondayQuery<BoardData>(`
      query ($boardId: ID!) {
        boards(ids: [$boardId]) {
          name
          description
          items_count
          groups { id title color }
          columns { id title type }
          items_page(limit: 20) {
            items {
              id
              name
              group { id title }
              column_values {
                id text type
                column { title }
              }
            }
          }
        }
      }
    `, { boardId: BOARD_ID });
  } catch {
    return null;
  }
}

const KOLONNE_FARVER: Record<string, string> = {
  text:       '#6366F1',
  status:     '#10B981',
  date:       '#F59E0B',
  people:     '#EC4899',
  numbers:    '#3B82F6',
  email:      '#8B5CF6',
  phone:      '#14B8A6',
  long_text:  '#6B7280',
  link:       '#0EA5E9',
  dropdown:   '#F97316',
};

export default async function MondayTestSide() {
  const data = await hentBoardData();

  if (!data) {
    return (
      <div className="dashboard-content">
        <div className="mon-fejl">
          <AlertCircle size={20} />
          <div>
            <strong>Kunne ikke hente Monday-data</strong>
            <p>Tjek at MONDAY_API_KEY og MONDAY_BOARD_ID er sat korrekt i miljøvariabler.</p>
          </div>
        </div>
      </div>
    );
  }

  const board = data.boards[0];
  if (!board) return <div className="dashboard-content"><p>Board ikke fundet.</p></div>;

  const items = board.items_page.items;

  return (
    <div className="dashboard-content">

      {/* Header */}
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

      {/* Board-overblik */}
      <div className="mon-kpi-grid">
        <div className="mon-kpi">
          <Hash size={18} className="mon-kpi-ikon" />
          <div>
            <div className="mon-kpi-tal">{board.items_count}</div>
            <div className="mon-kpi-label">Items i alt</div>
          </div>
        </div>
        <div className="mon-kpi">
          <Layout size={18} className="mon-kpi-ikon" />
          <div>
            <div className="mon-kpi-tal">{board.groups.length}</div>
            <div className="mon-kpi-label">Grupper</div>
          </div>
        </div>
        <div className="mon-kpi">
          <Columns size={18} className="mon-kpi-ikon" />
          <div>
            <div className="mon-kpi-tal">{board.columns.length}</div>
            <div className="mon-kpi-label">Kolonner</div>
          </div>
        </div>
        <div className="mon-kpi">
          <Users size={18} className="mon-kpi-ikon" />
          <div>
            <div className="mon-kpi-tal">{items.length}</div>
            <div className="mon-kpi-label">Items vist (max 20)</div>
          </div>
        </div>
      </div>

      <div className="mon-grid">

        {/* Grupper */}
        <div className="mon-kort">
          <h2 className="mon-kort-titel">Grupper (pipeline-stadier)</h2>
          <div className="mon-gruppe-liste">
            {board.groups.map((g) => (
              <div key={g.id} className="mon-gruppe-række">
                <span className="mon-gruppe-farve" style={{ background: g.color }} />
                <span className="mon-gruppe-navn">{g.title}</span>
                <span className="mon-gruppe-id">{g.id}</span>
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

      {/* Items */}
      <div className="mon-items-sektion">
        <h2 className="mon-kort-titel">De første {items.length} items</h2>
        <div className="mon-items-liste">
          {items.map((item) => {
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
