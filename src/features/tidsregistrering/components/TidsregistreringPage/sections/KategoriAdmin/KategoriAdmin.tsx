'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/KategoriAdmin/KategoriAdmin.tsx

import { useState, useEffect } from 'react';
import { Plus, Pencil, Check, X, EyeOff, Eye, ChevronDown, Trash2 } from 'lucide-react';
import {
  hentAlleKategorier, opretKategori, opdaterKategori, skiftKategoriAktiv, sletKategori,
  hentAlleUnderpunkterForKategorier, opretUnderpunkt, opdaterUnderpunkt, skiftUnderpunktAktiv, sletUnderpunkt,
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
  const [bekræftSletKat, setBekræftSletKat]   = useState<string | null>(null);
  const [bekræftSletUp, setBekræftSletUp]     = useState<string | null>(null);
  const [sletFejl, setSletFejl]               = useState<string | null>(null);

  async function load() {
    const kats = await hentAlleKategorier().catch(() => [] as TidsregistreringKategori[]);
    setKategorier(kats);
    const ups = await hentAlleUnderpunkterForKategorier().catch(() => [] as TidsregistreringUnderpunkt[]);
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

  async function håndterSletKat(id: string) {
    if (bekræftSletKat !== id) { setBekræftSletKat(id); setSletFejl(null); return; }
    try {
      await sletKategori(id);
      setBekræftSletKat(null);
      await load();
    } catch (e) {
      setSletFejl('Kategorien kan ikke slettes — der er sandsynligvis registreringer knyttet til den.');
      setBekræftSletKat(null);
    }
  }

  async function håndterSletUp(id: string) {
    if (bekræftSletUp !== id) { setBekræftSletUp(id); setSletFejl(null); return; }
    try {
      await sletUnderpunkt(id);
      setBekræftSletUp(null);
      await load();
    } catch (e) {
      setSletFejl('Underpunktet kan ikke slettes — der er sandsynligvis registreringer knyttet til det.');
      setBekræftSletUp(null);
    }
  }

  const aktive = kategorier.filter((k) => k.aktiv);
  const inaktive = kategorier.filter((k) => !k.aktiv);

  return (
    <div className="tr-kat-admin">
      <div className="tr-kat-stats">
        <div className="tr-kat-stat">
          <span className="tr-kat-stat-tal">{aktive.length}</span>
          <span className="tr-kat-stat-label">Aktive kategorier</span>
        </div>
        <div className="tr-kat-stat">
          <span className="tr-kat-stat-tal">{underpunkter.filter((u) => u.aktiv).length}</span>
          <span className="tr-kat-stat-label">Aktive underpunkter</span>
        </div>
        <div className="tr-kat-stat">
          <span className="tr-kat-stat-tal">{inaktive.length}</span>
          <span className="tr-kat-stat-label">Skjulte kategorier</span>
        </div>
      </div>

      {sletFejl && (
        <div className="tr-slet-fejl" role="alert">
          {sletFejl}
          <button onClick={() => setSletFejl(null)} className="tr-ikon-btn"><X size={14} /></button>
        </div>
      )}

      <div className="tr-kat-liste">
        {kategorier.map((k) => {
          const ups = underpunkterForKat(k.id);
          const åben = åbneKat.has(k.id);
          const sletterKat = bekræftSletKat === k.id;

          return (
            <div key={k.id} className={`tr-kat-kort${k.aktiv ? '' : ' inaktiv'}`}>
              <div className="tr-kat-hoved">
                <button className="tr-kat-toggle" onClick={() => toggleÅben(k.id)} aria-expanded={åben}>
                  <ChevronDown size={15} className={`tr-chevron${åben ? ' åben' : ''}`} />
                </button>

                {redigerKat === k.id ? (
                  <div className="tr-inline-edit">
                    <input
                      className="tr-inline-input"
                      value={redigerKatNavn}
                      onChange={(e) => setRedigerKatNavn(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && gemKategori(k.id)}
                      autoFocus
                    />
                    <button onClick={() => gemKategori(k.id)} className="tr-ikon-btn tr-gem"><Check size={14} /></button>
                    <button onClick={() => setRedigerKat(null)} className="tr-ikon-btn"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span className="tr-kat-navn">{k.navn}</span>
                    <span className="tr-kat-tæller">{ups.filter((u) => u.aktiv).length} underpunkter</span>
                  </>
                )}

                {redigerKat !== k.id && (
                  <div className="tr-kat-handlinger">
                    {sletterKat ? (
                      <>
                        <span className="tr-slet-confirm-tekst">Slet?</span>
                        <button onClick={() => håndterSletKat(k.id)} className="tr-ikon-btn tr-slet-ja"><Check size={14} /></button>
                        <button onClick={() => setBekræftSletKat(null)} className="tr-ikon-btn"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setRedigerKat(k.id); setRedigerKatNavn(k.navn); }} className="tr-ikon-btn" title="Rediger"><Pencil size={14} /></button>
                        <button onClick={() => skiftKategoriAktiv(k.id, !k.aktiv).then(load)} className="tr-ikon-btn" title={k.aktiv ? 'Skjul' : 'Aktiver'}>
                          {k.aktiv ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => håndterSletKat(k.id)} className="tr-ikon-btn tr-slet" title="Slet"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {åben && (
                <div className="tr-kat-underpunkter">
                  {ups.map((u) => {
                    const sletterUp = bekræftSletUp === u.id;
                    return (
                      <div key={u.id} className={`tr-up-rad${u.aktiv ? '' : ' inaktiv'}`}>
                        <span className="tr-up-dot" />
                        {redigerUp === u.id ? (
                          <div className="tr-inline-edit">
                            <input
                              className="tr-inline-input"
                              value={redigerUpNavn}
                              onChange={(e) => setRedigerUpNavn(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && gemUnderpunkt(u.id)}
                              autoFocus
                            />
                            <button onClick={() => gemUnderpunkt(u.id)} className="tr-ikon-btn tr-gem"><Check size={13} /></button>
                            <button onClick={() => setRedigerUp(null)} className="tr-ikon-btn"><X size={13} /></button>
                          </div>
                        ) : (
                          <>
                            <span className="tr-up-navn">{u.navn}</span>
                            <div className="tr-up-handlinger">
                              {sletterUp ? (
                                <>
                                  <span className="tr-slet-confirm-tekst">Slet?</span>
                                  <button onClick={() => håndterSletUp(u.id)} className="tr-ikon-btn tr-slet-ja"><Check size={13} /></button>
                                  <button onClick={() => setBekræftSletUp(null)} className="tr-ikon-btn"><X size={13} /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setRedigerUp(u.id); setRedigerUpNavn(u.navn); }} className="tr-ikon-btn" title="Rediger"><Pencil size={13} /></button>
                                  <button onClick={() => skiftUnderpunktAktiv(u.id, !u.aktiv).then(load)} className="tr-ikon-btn" title={u.aktiv ? 'Skjul' : 'Aktiver'}>
                                    {u.aktiv ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                  <button onClick={() => håndterSletUp(u.id)} className="tr-ikon-btn tr-slet" title="Slet"><Trash2 size={13} /></button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  <div className="tr-ny-up-rad">
                    <input
                      className="tr-inline-input"
                      placeholder="Tilføj underpunkt…"
                      value={nytUpNavn[k.id] ?? ''}
                      onChange={(e) => setNytUpNavn((prev) => ({ ...prev, [k.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && opretNytUnderpunkt(k.id)}
                    />
                    <button onClick={() => opretNytUnderpunkt(k.id)} className="tr-ikon-btn tr-gem" disabled={!nytUpNavn[k.id]?.trim()}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="tr-ny-kat-rad">
        <input
          className="tr-inline-input"
          placeholder="Ny kategori…"
          value={nytKatNavn}
          onChange={(e) => setNytKatNavn(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && opretNyKategori()}
        />
        <button onClick={opretNyKategori} className="tr-opret-knap" disabled={!nytKatNavn.trim()}>
          <Plus size={14} /> Opret
        </button>
      </div>
    </div>
  );
}
