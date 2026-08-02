'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/RedigerRegistreringModal/RedigerRegistreringModal.tsx

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  hentKategorier, hentUnderpunkter, opdaterRegistrering,
} from '@/features/tidsregistrering/services/TidsregistreringService';
import type { Tidsregistrering, TidsregistreringKategori, TidsregistreringUnderpunkt } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = {
  registrering: Tidsregistrering;
  onGem: (opdateret: Tidsregistrering) => void;
  onLuk: () => void;
};

function isoTilDato(iso: string): string {
  return iso.slice(0, 10);
}

function isoTilTid(iso: string): string {
  return new Date(iso).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function datoOgTidTilIso(dato: string, tid: string): string {
  return new Date(`${dato}T${tid}:00`).toISOString();
}

export function RedigerRegistreringModal({ registrering, onGem, onLuk }: Props) {
  const [kategorier, setKategorier]   = useState<TidsregistreringKategori[]>([]);
  const [underpunkter, setUnderpunkter] = useState<TidsregistreringUnderpunkt[]>([]);
  const [kategoriId, setKategoriId]   = useState(registrering.kategoriId);
  const [upId, setUpId]               = useState(registrering.underpunktId ?? '');
  const [dato, setDato]               = useState(isoTilDato(registrering.startTid));
  const [startTid, setStartTid]       = useState(isoTilTid(registrering.startTid));
  const [slutTid, setSlutTid]         = useState(registrering.slutTid ? isoTilTid(registrering.slutTid) : '');
  const [note, setNote]               = useState(registrering.note ?? '');
  const [gemmer, setGemmer]           = useState(false);
  const [fejl, setFejl]               = useState<string | null>(null);

  useEffect(() => {
    hentKategorier().then(setKategorier).catch(() => {});
  }, []);

  useEffect(() => {
    if (!kategoriId) { setUnderpunkter([]); return; }
    hentUnderpunkter(kategoriId).then(setUnderpunkter).catch(() => {});
    setUpId('');
  }, [kategoriId]);

  async function gem() {
    setFejl(null);
    if (!slutTid) { setFejl('Sluttid mangler.'); return; }
    const startIso = datoOgTidTilIso(dato, startTid);
    const slutIso  = datoOgTidTilIso(dato, slutTid);
    const diffMs   = new Date(slutIso).getTime() - new Date(startIso).getTime();
    if (diffMs <= 0) { setFejl('Sluttid skal være efter starttid.'); return; }
    const varighedMinutter = Math.round(diffMs / 60000);
    const valgtUp = underpunkter.find((u) => u.id === upId);
    setGemmer(true);
    try {
      await opdaterRegistrering(registrering.id, {
        kategoriId,
        underpunktId:   upId || null,
        underpunktNavn: valgtUp?.navn ?? null,
        startTid:       startIso,
        slutTid:        slutIso,
        varighedMinutter,
        note:           note.trim() || null,
      });
      const kategoriNavn = kategorier.find((k) => k.id === kategoriId)?.navn ?? registrering.kategoriNavn;
      onGem({
        ...registrering,
        kategoriId,
        kategoriNavn,
        underpunktId:     upId || null,
        underpunktNavn:   valgtUp?.navn ?? null,
        startTid:         startIso,
        slutTid:          slutIso,
        varighedMinutter,
        note:             note.trim() || null,
      });
    } catch {
      setFejl('Kunne ikke gemme. Prøv igen.');
      setGemmer(false);
    }
  }

  return (
    <div className="tr-modal-overlay" onClick={onLuk}>
      <div className="tr-modal-boks tr-rediger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tr-modal-hoved">
          <h2 className="tr-modal-titel">Rediger registrering</h2>
          <button className="tr-modal-luk" onClick={onLuk} aria-label="Luk"><X size={18} /></button>
        </div>

        <div className="tr-rediger-form">
          <div className="tr-rediger-felt">
            <label>Kategori</label>
            <select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)}>
              {kategorier.map((k) => (
                <option key={k.id} value={k.id}>{k.navn}</option>
              ))}
            </select>
          </div>

          {underpunkter.length > 0 && (
            <div className="tr-rediger-felt">
              <label>Underpunkt</label>
              <select value={upId} onChange={(e) => setUpId(e.target.value)}>
                <option value="">— ingen —</option>
                {underpunkter.map((u) => (
                  <option key={u.id} value={u.id}>{u.navn}</option>
                ))}
              </select>
            </div>
          )}

          <div className="tr-rediger-felt">
            <label>Dato</label>
            <input type="date" value={dato} onChange={(e) => setDato(e.target.value)} />
          </div>

          <div className="tr-rediger-grid-2">
            <div className="tr-rediger-felt">
              <label>Starttid</label>
              <input type="time" value={startTid} onChange={(e) => setStartTid(e.target.value)} />
            </div>
            <div className="tr-rediger-felt">
              <label>Sluttid</label>
              <input type="time" value={slutTid} onChange={(e) => setSlutTid(e.target.value)} />
            </div>
          </div>

          <div className="tr-rediger-felt">
            <label>Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Valgfri note…"
            />
          </div>

          {fejl && <p className="tr-slet-fejl">{fejl}</p>}

          <div className="tr-rediger-handlinger">
            <button className="tr-annuller-knap" onClick={onLuk} disabled={gemmer}>Annuller</button>
            <button className="tr-gem-knap" onClick={gem} disabled={gemmer}>
              {gemmer ? 'Gemmer…' : 'Gem ændringer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
