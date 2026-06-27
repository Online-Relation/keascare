// src/app/api/monday/test/route.ts

import { NextResponse } from 'next/server';
import { mondayQuery } from '@/lib/api/MondayClient';

const BOARD_ID = process.env.MONDAY_BOARD_ID;

export async function GET() {
  if (!BOARD_ID) return NextResponse.json({ fejl: 'MONDAY_BOARD_ID mangler' }, { status: 500 });

  try {
    // Hent board-info, kolonner og de første 25 items
    const data = await mondayQuery<{
      boards: Array<{
        name: string;
        description: string | null;
        items_count: number;
        groups: Array<{ id: string; title: string; color: string }>;
        columns: Array<{ id: string; title: string; type: string }>;
        items_page: {
          cursor: string | null;
          items: Array<{
            id: string;
            name: string;
            group: { id: string; title: string };
            column_values: Array<{ id: string; text: string | null; type: string; column: { title: string } }>;
          }>;
        };
      }>;
    }>(`
      query ($boardId: ID!, $limit: Int!) {
        boards(ids: [$boardId]) {
          name
          description
          items_count
          groups {
            id
            title
            color
          }
          columns {
            id
            title
            type
          }
          items_page(limit: $limit) {
            cursor
            items {
              id
              name
              group { id title }
              column_values {
                id
                text
                type
                column { title }
              }
            }
          }
        }
      }
    `, { boardId: BOARD_ID, limit: 25 });

    const board = data.boards[0];
    if (!board) return NextResponse.json({ fejl: 'Board ikke fundet' }, { status: 404 });

    return NextResponse.json({
      board: {
        navn: board.name,
        beskrivelse: board.description,
        antalItems: board.items_count,
        grupper: board.groups,
        kolonner: board.columns,
      },
      eksempelItems: board.items_page.items,
    });
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ fejl: besked }, { status: 500 });
  }
}
