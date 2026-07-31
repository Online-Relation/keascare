'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/KategoriAdmin/KategoriAdmin.tsx

import { useState, useEffect } from 'react';
import { Plus, Pencil, Check, X, EyeOff, Eye } from 'lucide-react';
import { hentAlleKategorier, opretKategori, opdaterKategori, skiftKategoriAktiv } from '@/features/tidsregistrering/services/TidsregistreringService';
import type { TidsregistreringKategori } from '@/features/tidsregistrering/types/tidsregistrering.types';

export function KategoriAdmin() {
  const [kategorier, setKategorier] = useState<TidsregistreringKategori[]>([]);
  const [nytNavn, setNytNavn]       = useState('');
  const [redigerer, setRedigerer]   = useState<string | null>(null);
  const [redigerNavn, setRedigerNavn] = useState('');

  async function load() {
    setKategorier(await hentAlleKategorier());
  }

  useEffect(() => { load(); }, []);

  async function opret() {
    if (!nytNavn.trim()) return;
    await opretKategori(nytNavn.trim());
    setNytNavn('');
    await load();
  }

  async function gem(id: string) {
    if (!redigerNavn.trim()) return;
    await opdaterKategori(id, redigerNavn.trim());
    setRedigerer(null);
    await load();
  }

  async function skiftAktiv(id: string, aktiv: boolean) {
    await skiftKategoriAktiv(id, !aktiv);
    await load();
  }

  return (
    <div className="tr-kategori-admin">
      <h3 className="tr-section-titel">Kategorier</h3>

      <div className="tr-kategori-liste">
        {kategorier.map((k) => (
          <div key={k.id} className={`tr-kategori-rad${k.aktiv ? '' : ' inaktiv'}`}>
            {redigerer === k.id ? (
              <>
                <input
                  className="tr-note-input"
                  value={redigerNavn}
                  onChange={(e) => setRedigerNavn(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && gem(k.id)}
                  autoFocus
                />
                <button onClick={() => gem(k.id)} className="tr-ikon-btn"><Check size={14} /></button>
                <button onClick={() => setRedigerer(null)} className="tr-ikon-btn"><X size={14} /></button>
              </>
            ) : (
              <>
                <span className="tr-kategori-navn">{k.navn}</span>
                <button onClick={() => { setRedigerer(k.id); setRedigerNavn(k.navn); }} className="tr-ikon-btn">
                  <Pencil size={14} />
                </button>
                <button onClick={() => skiftAktiv(k.id, k.aktiv)} className="tr-ikon-btn" title={k.aktiv ? 'Deaktiver' : 'Aktiver'}>
                  {k.aktiv ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="tr-ny-kategori">
        <input
          className="tr-note-input"
          placeholder="Ny kategori…"
          value={nytNavn}
          onChange={(e) => setNytNavn(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && opret()}
        />
        <button onClick={opret} className="btn btn-primary btn-sm" disabled={!nytNavn.trim()}>
          <Plus size={14} /> Opret
        </button>
      </div>
    </div>
  );
}
