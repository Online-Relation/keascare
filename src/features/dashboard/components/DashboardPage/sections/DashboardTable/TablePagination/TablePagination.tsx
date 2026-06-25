// src/features/dashboard/components/DashboardPage/sections/DashboardTable/TablePagination/TablePagination.tsx

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type TablePaginationProps = {
  side: number;
  totalSider: number;
  totalAntal: number;
  fraNr: number;
  tilNr: number;
  onForrige: () => void;
  onNaeste: () => void;
};

export function TablePagination({
  side,
  totalSider,
  totalAntal,
  fraNr,
  tilNr,
  onForrige,
  onNaeste,
}: TablePaginationProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      borderTop: '1px solid var(--color-border)',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-text-secondary)',
    }}>
      <span>
        Viser {fraNr}–{tilNr} af {totalAntal} bosteder
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={onForrige}
          disabled={side === 1}
          aria-label="Forrige side"
        >
          <ChevronLeft size={14} />
        </button>

        <span style={{ padding: '0 0.25rem' }}>
          Side {side} af {totalSider}
        </span>

        <button
          className="btn btn-outline btn-sm"
          onClick={onNaeste}
          disabled={side === totalSider}
          aria-label="Næste side"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
