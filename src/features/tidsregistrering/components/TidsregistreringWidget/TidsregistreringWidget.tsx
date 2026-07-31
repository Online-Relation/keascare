'use client';

// src/features/tidsregistrering/components/TidsregistreringWidget/TidsregistreringWidget.tsx

import { useState, useEffect, useCallback } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { hentKategorier, startTimer, stopTimer } from '@/features/tidsregistrering/services/TidsregistreringService';
import type { TidsregistreringKategori } from '@/features/tidsregistrering/types/tidsregistrering.types';

const LS_ID  = 'tr_aktiv_id';
const LS_KAT = 'tr_aktiv_kategori';
const LS_START = 'tr_aktiv_start';

function formatTid(sek: number): string {
  const h = Math.floor(sek / 3600);
  const m = Math.floor((sek % 3600) / 60);
  const s = sek % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TidsregistreringWidget() {
  const [kategorier, setKategorier]     = useState<TidsregistreringKategori[]>([]);
  const [valgtId, setValgtId]           = useState<string>('');
  const [kører, setKører]               = useState(false);
  const [aktivRegistreringId, setAktivRegistreringId] = useState<string | null>(null);
  const [sek, setSek]                   = useState(0);
  const [gemmer, setGemmer]             = useState(false);

  // Gendan aktiv timer fra localStorage
  useEffect(() => {
    const id    = localStorage.getItem(LS_ID);
    const kat   = localStorage.getItem(LS_KAT);
    const start = localStorage.getItem(LS_START);
    if (id && start) {
      setAktivRegistreringId(id);
      setKører(true);
      if (kat) setValgtId(kat);
      const forløbet = Math.floor((Date.now() - Number(start)) / 1000);
      setSek(forløbet > 0 ? forløbet : 0);
    }
  }, []);

  useEffect(() => {
    hentKategorier().then((k) => {
      setKategorier(k);
      setValgtId((prev) => prev || k[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    if (!kører) return;
    const interval = setInterval(() => setSek((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [kører]);

  const handleStart = useCallback(async () => {
    if (!valgtId) return;
    const id = await startTimer(valgtId);
    localStorage.setItem(LS_ID, id);
    localStorage.setItem(LS_KAT, valgtId);
    localStorage.setItem(LS_START, String(Date.now()));
    setAktivRegistreringId(id);
    setSek(0);
    setKører(true);
  }, [valgtId]);

  const handleStop = useCallback(async () => {
    if (!aktivRegistreringId) return;
    setGemmer(true);
    await stopTimer(aktivRegistreringId);
    localStorage.removeItem(LS_ID);
    localStorage.removeItem(LS_KAT);
    localStorage.removeItem(LS_START);
    setAktivRegistreringId(null);
    setKører(false);
    setSek(0);
    setGemmer(false);
  }, [aktivRegistreringId]);

  if (kategorier.length === 0) return null;

  return (
    <div className="tr-widget">
      <Clock size={14} className="tr-widget-ikon" />
      {kører ? (
        <>
          <span className="tr-widget-tid">{formatTid(sek)}</span>
          <span className="tr-widget-kategori">
            {kategorier.find((k) => k.id === valgtId)?.navn ?? ''}
          </span>
          <button
            className="tr-widget-stop"
            onClick={handleStop}
            disabled={gemmer}
            aria-label="Stop timer"
          >
            <Square size={12} />
            {gemmer ? 'Gemmer…' : 'Stop'}
          </button>
        </>
      ) : (
        <>
          <select
            className="tr-widget-select"
            value={valgtId}
            onChange={(e) => setValgtId(e.target.value)}
          >
            {kategorier.map((k) => (
              <option key={k.id} value={k.id}>{k.navn}</option>
            ))}
          </select>
          <button
            className="tr-widget-start"
            onClick={handleStart}
            aria-label="Start timer"
          >
            <Play size={12} />
            Start
          </button>
        </>
      )}
    </div>
  );
}
