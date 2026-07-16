'use client';

import { useEffect, useState } from 'react';
import { Newspaper } from 'lucide-react';
import type { RegulatoryItem, ReviewStatus, RelevanceLevel } from '@/features/regelovervagning/types/regulatory.types';
import { RegulatoryFundKort } from '@/features/regelovervagning/components/RegelovervagningPage/sections/RegulatoryFundKort';

export function StpsNyhederPage() {
  const [items, setItems] = useState<RegulatoryItem[]>([]);
  const [loader, setLoader] = useState(true);
  const [relevansFilter, setRelevansFilter] = useState<RelevanceLevel | ''>('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | ''>('');

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

  async function opdaterStatus(id: string, status: ReviewStatus) {
    await fetch(`/api/regelovervagning/items/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    hent();
  }

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
      </div>

      {loader && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Henter…</p>}

      {!loader && items.length === 0 && (
        <div className="bosted-detail-kort" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Ingen STPS-nyheder endnu. Vent på næste daglige import.</p>
        </div>
      )}

      <div className="regulatory-liste">
        {items.map((item) => (
          <RegulatoryFundKort key={item.id} item={item} onStatusSkift={opdaterStatus} />
        ))}
      </div>
    </div>
  );
}
