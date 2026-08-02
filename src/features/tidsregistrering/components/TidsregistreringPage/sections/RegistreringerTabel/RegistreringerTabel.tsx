'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/RegistreringerTabel/RegistreringerTabel.tsx

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { hentRegistreringer, sletRegistrering } from '@/features/tidsregistrering/services/TidsregistreringService';
import { RedigerRegistreringModal } from '../RedigerRegistreringModal';
import type { Tidsregistrering } from '@/features/tidsregistrering/types/tidsregistrering.types';

function formatDato(iso: string): string {
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatKlokkeslet(iso: string): string {
  return new Date(iso).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
}

function formatVarighed(min: number | null): string {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}t ${m}m`;
  return `${m}m`;
}

export function RegistreringerTabel() {
  const [registreringer, setRegistreringer] = useState<Tidsregistrering[]>([]);
  const [redigerer, setRedigerer]           = useState<Tidsregistrering | null>(null);
  const [indlæser, setIndlæser]             = useState(true);

  const load = useCallback(async () => {
    setIndlæser(true);
    const data = await hentRegistreringer(200);
    setRegistreringer(data);
    setIndlæser(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function slet(id: string) {
    if (!confirm('Slet denne registrering?')) return;
    await sletRegistrering(id);
    setRegistreringer((prev) => prev.filter((r) => r.id !== id));
  }

  function håndterGem(opdateret: Tidsregistrering) {
    setRegistreringer((prev) => prev.map((r) => r.id === opdateret.id ? opdateret : r));
    setRedigerer(null);
  }

  if (indlæser) return <p className="tr-loading">Henter registreringer…</p>;
  if (registreringer.length === 0) return <p className="tr-tom">Ingen registreringer endnu.</p>;

  const grupper = registreringer.reduce<Record<string, Tidsregistrering[]>>((acc, r) => {
    const dato = formatDato(r.startTid);
    (acc[dato] ??= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <div className="tr-registreringer-wrapper">
        {Object.entries(grupper).map(([dato, rækker]) => {
          const totalMin = rækker.reduce((s, r) => s + (r.varighedMinutter ?? 0), 0);
          return (
            <div key={dato} className="tr-dag-gruppe">
              <div className="tr-dag-header">
                <span>{dato}</span>
                <span className="tr-dag-total">{formatVarighed(totalMin)} i alt</span>
              </div>
              <table className="tr-tabel">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Tid</th>
                    <th>Varighed</th>
                    <th>Note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rækker.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span>{r.kategoriNavn}</span>
                        {r.underpunktNavn && (
                          <span className="tr-underpunkt-label"> · {r.underpunktNavn}</span>
                        )}
                      </td>
                      <td className="tr-tid-celle">
                        {formatKlokkeslet(r.startTid)} – {r.slutTid ? formatKlokkeslet(r.slutTid) : '…'}
                      </td>
                      <td>{formatVarighed(r.varighedMinutter)}</td>
                      <td className="tr-note-celle">
                        <span className="tr-note-tekst">{r.note || <span className="tr-note-tom">—</span>}</span>
                      </td>
                      <td className="tr-tabel-handlinger">
                        <button onClick={() => setRedigerer(r)} className="tr-ikon-btn" aria-label="Rediger">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => slet(r.id)} className="tr-ikon-btn tr-slet" aria-label="Slet">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {redigerer && (
        <RedigerRegistreringModal
          registrering={redigerer}
          onGem={håndterGem}
          onLuk={() => setRedigerer(null)}
        />
      )}
    </>
  );
}
