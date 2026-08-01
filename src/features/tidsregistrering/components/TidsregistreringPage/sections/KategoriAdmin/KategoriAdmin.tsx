'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/KategoriAdmin/KategoriAdmin.tsx

import { useState, useEffect } from 'react';
import { Plus, Pencil, Check, X, EyeOff, Eye, ChevronDown } from 'lucide-react';
import {
  hentAlleKategorier, opretKategori, opdaterKategori, skiftKategoriAktiv,
  hentAlleUnderpunkterForKategorier, opretUnderpunkt, opdaterUnderpunkt, skiftUnderpunktAktiv,
} from '@/features/tidsregistrering/services/TidsregistreringService';
import type { TidsregistreringKategori, TidsregistreringUnderpunkt } from '@/features/tidsregistrering/types/tidsregistrering.types';

export function KategoriAdmin() {
  const [kategorier, setKategorier]           = useState<TidsregistreringKategori[]>([]);
  const [underpunkter, setUnderpunkter]       = useState<TidsregistreringUnderpunkt[]>([]);
  const [åbneKat, setÅbneKat]                = useState<Set<string>>(new Set());
  const [nytKatNavn, setNytKatNavn]           = useState('');
  const [redigerKat, setRedigerKat]           = useState<string | null>(null);
  const [redigerKatNavn, setRedigerKatNavn]   = useState('');
  const [redigerUp, setRedigerUp]             = useState<string | null>(null);
  const [redigerUpNavn, setRedigerUpNavn]     = useState('');
  const [nytUpNavn, setNytUpNavn]             = useState<Record<string, string>>({});

  async function load() {
    const [kats, ups] = await Promise.all([hentAlleKategorier(), hentAlleUnderpunkterForKategorier()]);
    setKategorier(kats);
    setUnderpunkter(ups);
  }

  useEffect(() => { load(); }, []);

  function underpunkterForKat(katId: string) {
    return underpunkter.filter((u) => u.kategoriId === katId);
  }

  function toggleÅben(id: string) {
    setÅbneKat((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function gemKategori(id: string) {
    if (!redigerKatNavn.trim()) return;
    await opdaterKategori(id, redigerKatNavn.trim());
    setRedigerKat(null);
    await load();
  }

  async function opretNyKategori() {
    if (!nytKatNavn.trim()) return;
    await opretKategori(nytKatNavn.trim());
    setNytKatNavn('');
    await load();
  }

  async function gemUnderpunkt(id: string) {
    if (!redigerUpNavn.trim()) return;
    await opdaterUnderpunkt(id, redigerUpNavn.trim());
    setRedigerUp(null);
    await load();
  }

  async function opretNytUnderpunkt(katId: string) {
    const navn = (nytUpNavn[katId] ?? '').trim();
    if (!navn) return;
    await opretUnderpunkt(katId, navn);
    setNytUpNavn((prev) => ({ ...prev, [katId]: '' }));
    await load();
    setÅbneKat((prev) => new Set([...prev, katId]));
  }

  return (
    <div className="tr-kategori-admin">
      <h3 className="tr-section-titel">Kategorier & Underpunkter</h3>

      <div className="tr-kategori-liste">
        {kategorier.map((k) => {
          const ups = underpunkterForKat(k.id);
          const åben = åbneKat.has(k.id);
          return (
            <div key={k.id} className={`tr-kategori-gruppe${k.aktiv ? '' : ' inaktiv'}`}>
              <div className="tr-kategori-rad">
                <button className="tr-kategori-toggle" onClick={() => toggleÅben(k.id)} aria-expanded={åben}>
                  <ChevronDown size={14} className={`tr-chevron${åben ? ' åben' : ''}`} />
                </button>

                {redigerKat === k.id ? (
                  <>
                    <input
                      className="tr-note-input"
                      value={redigerKatNavn}
                      onChange={(e) => setRedigerKatNavn(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && gemKategori(k.id)}
                      autoFocus
                    />
                    <button onClick={() => gemKategori(k.id)} className="tr-ikon-btn"><Check size={14} /></button>
                    <button onClick={() => setRedigerKat(null)} className="tr-ikon-btn"><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <span className="tr-kategori-navn">{k.navn}</span>
                    <span className="tr-up-tæller">{ups.filter((u) => u.aktiv).length} underpunkter</span>
                    <button onClick={() => { setRedigerKat(k.id); setRedigerKatNavn(k.navn); }} className="tr-ikon-btn"><Pencil size={14} /></button>
                    <button onClick={() => skiftKategoriAktiv(k.id, !k.aktiv).then(load)} className="tr-ikon-btn" title={k.aktiv ? 'Deaktiver' : 'Aktiver'}>
                      {k.aktiv ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </>
                )}
              </div>

              {åben && (
                <div className="tr-underpunkter">
                  {ups.map((u) => (
                    <div key={u.id} className={`tr-underpunkt-rad${u.aktiv ? '' : ' inaktiv'}`}>
                      {redigerUp === u.id ? (
                        <>
                          <input
                            className="tr-note-input"
                            value={redigerUpNavn}
                            onChange={(e) => setRedigerUpNavn(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && gemUnderpunkt(u.id)}
                            autoFocus
                          />
                          <button onClick={() => gemUnderpunkt(u.id)} className="tr-ikon-btn"><Check size={14} /></button>
                          <button onClick={() => setRedigerUp(null)} className="tr-ikon-btn"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <span className="tr-underpunkt-navn">{u.navn}</span>
                          <button onClick={() => { setRedigerUp(u.id); setRedigerUpNavn(u.navn); }} className="tr-ikon-btn"><Pencil size={14} /></button>
                          <button onClick={() => skiftUnderpunktAktiv(u.id, !u.aktiv).then(load)} className="tr-ikon-btn" title={u.aktiv ? 'Deaktiver' : 'Aktiver'}>
                            {u.aktiv ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  <div className="tr-ny-underpunkt">
                    <input
                      className="tr-note-input"
                      placeholder="Nyt underpunkt…"
                      value={nytUpNavn[k.id] ?? ''}
                      onChange={(e) => setNytUpNavn((prev) => ({ ...prev, [k.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && opretNytUnderpunkt(k.id)}
                    />
                    <button onClick={() => opretNytUnderpunkt(k.id)} className="tr-ikon-btn" disabled={!nytUpNavn[k.id]?.trim()}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="tr-ny-kategori">
        <input
          className="tr-note-input"
          placeholder="Ny kategori…"
          value={nytKatNavn}
          onChange={(e) => setNytKatNavn(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && opretNyKategori()}
        />
        <button onClick={opretNyKategori} className="btn btn-primary btn-sm" disabled={!nytKatNavn.trim()}>
          <Plus size={14} /> Opret
        </button>
      </div>
    </div>
  );
}
