'use client';

// src/features/dashboard/components/BostedDetailPage/sections/BostedRedigerCvr/BostedRedigerCvr.tsx

import { useState } from 'react';
import { Pencil, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';

type Props = {
  bostedId: string;
  nuværendeCvr: string | null;
};

type Status = 'idle' | 'loading' | 'ok' | 'fejl';

export function BostedRedigerCvr({ bostedId, nuværendeCvr }: Props) {
  const { rolle } = useBrugerRolle();
  const [åben, setÅben] = useState(false);
  const [cvr, setCvr] = useState(nuværendeCvr ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const [besked, setBesked] = useState('');

  if (rolle !== 'development') return null;

  async function gem() {
    if (!/^\d{8}$/.test(cvr.trim())) {
      setBesked('CVR skal være præcis 8 cifre');
      setStatus('fejl');
      return;
    }

    setStatus('loading');
    setBesked('');

    const res = await fetch(`/api/admin/bosted-cvr/${bostedId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvr: cvr.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus('fejl');
      setBesked(data.error ?? 'Noget gik galt');
    } else {
      setStatus('ok');
      setBesked(data.advarsel ?? `CVR ${cvr.trim()} gemt og synkroniseret`);
      setTimeout(() => {
        setÅben(false);
        setStatus('idle');
        setBesked('');
        window.location.reload();
      }, 1800);
    }
  }

  return (
    <>
      <button
        className="btn btn-sm btn-ghost"
        style={{ fontSize: 'var(--text-xs)', gap: '0.3rem', display: 'flex', alignItems: 'center' }}
        onClick={() => { setÅben(true); setCvr(nuværendeCvr ?? ''); setStatus('idle'); setBesked(''); }}
        title="Ret CVR-nummer (kun udvikler)"
      >
        <Pencil size={12} />
        Ret CVR
      </button>

      {åben && (
        <div className="modal-overlay" onClick={() => setÅben(false)}>
          <div className="modal-boks" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-titel">Ret CVR-nummer</span>
              <button className="modal-luk" onClick={() => setÅben(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
                Indtast et 8-cifret CVR-nummer. Systemet synkroniserer straks CVR-data (ansatte, branche, type).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--fw-medium)' }}>
                  CVR-nummer
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={cvr}
                  onChange={(e) => setCvr(e.target.value.replace(/\D/g, ''))}
                  placeholder="12345678"
                  className="input"
                  style={{ fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: 'var(--text-base)' }}
                  disabled={status === 'loading' || status === 'ok'}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') gem(); }}
                />
              </div>

              {besked && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  fontSize: 'var(--text-xs)',
                  color: status === 'fejl' ? 'var(--color-danger)' : 'var(--color-success)',
                }}>
                  {status === 'fejl' ? <AlertCircle size={13} /> : <Check size={13} />}
                  {besked}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={gem}
                disabled={status === 'loading' || status === 'ok' || cvr.length !== 8}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                {status === 'loading' ? (
                  <><RefreshCw size={14} className="spin" /> Synkroniserer…</>
                ) : status === 'ok' ? (
                  <><Check size={14} /> Gemt</>
                ) : (
                  <><RefreshCw size={14} /> Gem og synkroniser</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
