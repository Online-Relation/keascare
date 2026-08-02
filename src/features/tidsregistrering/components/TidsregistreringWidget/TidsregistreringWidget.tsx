'use client';

// src/features/tidsregistrering/components/TidsregistreringWidget/TidsregistreringWidget.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Clock, X } from 'lucide-react';
import { hentKategorier, hentUnderpunkter, startTimer, stopTimer, sletRegistrering } from '@/features/tidsregistrering/services/TidsregistreringService';
import type { TidsregistreringKategori, TidsregistreringUnderpunkt } from '@/features/tidsregistrering/types/tidsregistrering.types';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';

const LS_ID    = 'tr_aktiv_id';
const LS_KAT   = 'tr_aktiv_kategori';
const LS_START = 'tr_aktiv_start';

function formatTid(sek: number): string {
  const h = Math.floor(sek / 3600);
  const m = Math.floor((sek % 3600) / 60);
  const s = sek % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TidsregistreringWidget() {
  const { rolle, loading } = useBrugerRolle();
  const [kategorier, setKategorier]             = useState<TidsregistreringKategori[]>([]);
  const [valgtId, setValgtId]                   = useState<string>('');
  const [kører, setKører]                       = useState(false);
  const [aktivRegistreringId, setAktivRegistreringId] = useState<string | null>(null);
  const [sek, setSek]                           = useState(0);
  const [gemmer, setGemmer]                     = useState(false);
  const [visStopModal, setVisStopModal]         = useState(false);
  const [note, setNote]                         = useState('');
  const [underpunkter, setUnderpunkter]         = useState<TidsregistreringUnderpunkt[]>([]);
  const [valgtUnderpunktId, setValgtUnderpunktId] = useState<string>('');
  const noteRef                                 = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (visStopModal) setTimeout(() => noteRef.current?.focus(), 100);
  }, [visStopModal]);

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

  async function åbnStopModal() {
    setNote('');
    setValgtUnderpunktId('');
    setVisStopModal(true);
    if (valgtId) {
      const up = await hentUnderpunkter(valgtId);
      setUnderpunkter(up.filter((u) => u.aktiv));
    }
  }

  const handleGem = useCallback(async () => {
    if (!aktivRegistreringId) return;
    setGemmer(true);
    const up = underpunkter.find((u) => u.id === valgtUnderpunktId);
    await stopTimer(aktivRegistreringId, note.trim() || undefined, up?.id, up?.navn);
    localStorage.removeItem(LS_ID);
    localStorage.removeItem(LS_KAT);
    localStorage.removeItem(LS_START);
    setAktivRegistreringId(null);
    setKører(false);
    setSek(0);
    setGemmer(false);
    setVisStopModal(false);
    setNote('');
    setUnderpunkter([]);
    setValgtUnderpunktId('');
  }, [aktivRegistreringId, note]);

  async function lukUdenAtGemme() {
    // Slet den igangværende registrering og stop timeren
    if (aktivRegistreringId) {
      await sletRegistrering(aktivRegistreringId).catch(() => {});
    }
    localStorage.removeItem(LS_ID);
    localStorage.removeItem(LS_KAT);
    localStorage.removeItem(LS_START);
    setAktivRegistreringId(null);
    setKører(false);
    setSek(0);
    setVisStopModal(false);
    setNote('');
    setUnderpunkter([]);
    setValgtUnderpunktId('');
  }

  if (loading) return null;
  if (rolle !== 'bostedsansvarlig' && rolle !== 'development') return null;
  if (kategorier.length === 0) return null;

  const kategoriNavn = kategorier.find((k) => k.id === valgtId)?.navn ?? '';

  return (
    <>
      <div className={`tr-widget${kører ? ' tr-widget--kører' : ''}`}>
        <div className="tr-widget-venstre">
          <Clock size={15} className="tr-widget-ikon" />
          {kører ? (
            <div className="tr-widget-info">
              <span className="tr-widget-tid">{formatTid(sek)}</span>
              <span className="tr-widget-kategori-navn">{kategoriNavn}</span>
            </div>
          ) : (
            <select
              className="tr-widget-select"
              value={valgtId}
              onChange={(e) => setValgtId(e.target.value)}
            >
              {kategorier.map((k) => (
                <option key={k.id} value={k.id}>{k.navn}</option>
              ))}
            </select>
          )}
        </div>

        {kører ? (
          <button className="tr-widget-stop-knap" onClick={åbnStopModal} aria-label="Stop timer">
            <Square size={14} />
            Stop
          </button>
        ) : (
          <button className="tr-widget-start-knap" onClick={handleStart} aria-label="Start timer">
            <Play size={14} />
            Start
          </button>
        )}
      </div>

      {/* Stop-modal */}
      {visStopModal && (
        <div className="tr-modal-overlay" onClick={lukModal}>
          <div className="tr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tr-modal-header">
              <div>
                <h2 className="tr-modal-titel">Stop registrering</h2>
                <p className="tr-modal-subtitle">{kategoriNavn} · {formatTid(sek)}</p>
              </div>
              <button className="tr-modal-luk" onClick={lukModal} aria-label="Luk">
                <X size={18} />
              </button>
            </div>

            <div className="tr-modal-body">
              {underpunkter.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="tr-modal-label">Underpunkt</label>
                  <select
                    className="tr-modal-select"
                    value={valgtUnderpunktId}
                    onChange={(e) => setValgtUnderpunktId(e.target.value)}
                  >
                    <option value="">— Vælg underpunkt —</option>
                    {underpunkter.map((u) => (
                      <option key={u.id} value={u.id}>{u.navn}</option>
                    ))}
                  </select>
                </div>
              )}
              <label className="tr-modal-label">Kommentar <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(valgfri)</span></label>
              <textarea
                ref={noteRef}
                className="tr-modal-textarea"
                placeholder="Hvad lavede du? Fx: Møde med bostedet om ny medarbejder…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
            </div>

            <div className="tr-modal-footer">
              <button className="tr-modal-gem" onClick={handleGem} disabled={gemmer}>
                {gemmer ? 'Gemmer…' : 'Gem registrering'}
              </button>
              <button className="tr-modal-afbryd" onClick={lukUdenAtGemme}>
                Luk uden at gemme
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
