'use client';

import { useEffect, useState } from 'react';
import { Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RegulatoryItem, ReviewStatus, RelevanceLevel } from '@/features/regelovervagning/types/regulatory.types';
import { RegulatoryFundKort } from '@/features/regelovervagning/components/RegelovervagningPage/sections/RegulatoryFundKort';

const SIDE_STØRRELSE = 10;

export function StpsNyhederPage() {
  const [items, setItems] = useState<RegulatoryItem[]>([]);
  const [loader, setLoader] = useState(true);
  const [relevansFilter, setRelevansFilter] = useState<RelevanceLevel | ''>('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | ''>('');
  const [side, setSide] = useState(1);

  async function hent() {
    setLoader(true);
    const params = new URLSearchParams({ source: 'stps' });
    if (relevansFilter) params.set('relevanceLevel', relevansFilter);
    if (statusFilter)   params.set('reviewStatus', statusFilter);
    const res = await fetch(`/api/regelovervagning/items?${params}`);
    const d = await res.json() as { ok: boolean; items?: RegulatoryItem[] };
    if (d.ok) setItems(d.items ?? []);
    setLoader(false);
  }

  useEffect(() => { hent(); }, [relevansFilter, statusFilter]);
  useEffect(() => { setSide(1); }, [relevansFilter, statusFilter]);

  async function opdaterStatus(id: string, status: ReviewStatus) {
    await fetch(`/api/regelovervagning/items/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    hent();
  }

  const antalSider = Math.max(1, Math.ceil(items.length / SIDE_STØRRELSE));
  const visItems = items.slice((side - 1) * SIDE_STØRRELSE, side * SIDE_STØRRELSE);

  return (
    <div className="kunder-layout">
      <div className="kunder-header">
        <Newspaper size={20} />
        <div>
          <h1 className="kunder-titel">STPS-nyheder</h1>
          <p className="kunder-undertitel">Nyheder og udgivelser fra Styrelsen for Patientsikkerhed</p>
        </div>
      </div>

      <div className="regulatory-filter-række">
        <select className="regulatory-select" value={relevansFilter} onChange={(e) => setRelevansFilter(e.target.value as RelevanceLevel | '')}>
          <option value="">Alle relevansniveauer</option>
          <option value="høj">Høj</option>
          <option value="middel">Middel</option>
          <option value="lav">Lav</option>
        </select>
        <select className="regulatory-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | '')}>
          <option value="">Alle statusser</option>
          <option value="ny">Ny</option>
          <option value="læst">Læst</option>
          <option value="relevant">Relevant</option>
          <option value="ikke_relevant">Ikke relevant</option>
          <option value="handling">Kræver handling</option>
        </select>
        {!loader && items.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
            {items.length} resultater
          </span>
        )}
      </div>

      {loader && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Henter…</p>}

      {!loader && items.length === 0 && (
        <div className="bosted-detail-kort" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Ingen STPS-nyheder endnu. Vent på næste daglige import.</p>
        </div>
      )}

      <div className="regulatory-liste">
        {visItems.map((item) => (
          <RegulatoryFundKort key={item.id} item={item} onStatusSkift={opdaterStatus} />
        ))}
      </div>

      {antalSider > 1 && (
        <div className="pagination">
          <button
            className="pagination-knap"
            onClick={() => setSide((s) => Math.max(1, s - 1))}
            disabled={side === 1}
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: antalSider }, (_, i) => i + 1).map((s) => (
            <button
              key={s}
              className={`pagination-knap${s === side ? ' pagination-knap--aktiv' : ''}`}
              onClick={() => setSide(s)}
            >
              {s}
            </button>
          ))}
          <button
            className="pagination-knap"
            onClick={() => setSide((s) => Math.min(antalSider, s + 1))}
            disabled={side === antalSider}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
