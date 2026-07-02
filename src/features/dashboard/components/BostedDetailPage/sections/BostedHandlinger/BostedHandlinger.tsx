'use client';

import { useState } from 'react';
import { PlusCircle, ExternalLink, PhoneOff, Clock, CheckCircle, Loader } from 'lucide-react';

type KontaktStatus = 'kontaktet' | 'kontakt_senere' | 'afvist';

type Props = {
  bostedId: string;
  mondayItemId?: string | null;
  onLogget?: () => void;
};

const KNAPPER: { status: KontaktStatus; label: string; icon: React.ElementType; farve?: string }[] = [
  { status: 'kontaktet',      label: 'Kontaktet',      icon: CheckCircle },
  { status: 'kontakt_senere', label: 'Kontakt senere', icon: Clock },
  { status: 'afvist',        label: 'Afvist',         icon: PhoneOff, farve: 'var(--color-accent)' },
];

const AFVISNINGS_ÅRSAGER = [
  'Har en anden samarbejdspartner',
  'Har egen sygeplejerske',
  'Ønsker ikke hjælp',
  'Forkert målgruppe',
  'Kommunalt / offentligt drevet',
  'Ingen kontakt opnået',
  'Lukker / under afvikling',
  'Andet',
];

export function BostedHandlinger({ bostedId, mondayItemId, onLogget }: Props) {
  const [valgt, setValgt] = useState<KontaktStatus | null>(null);
  const [afvisningsÅrsag, setAfvisningsÅrsag] = useState('');
  const [note, setNote] = useState('');
  const [sender, setSender] = useState(false);
  const [bekræftet, setBekræftet] = useState(false);

  const MONDAY_URL = mondayItemId
    ? `https://onlinerelation.monday.com/boards/${process.env.NEXT_PUBLIC_MONDAY_BOARD_ID}/pulses/${mondayItemId}`
    : null;

  function vælgStatus(status: KontaktStatus) {
    setValgt(valgt === status ? null : status);
    setAfvisningsÅrsag('');
    setNote('');
  }

  async function gemKontakt() {
    if (!valgt) return;
    const noteLinjer = [];
    if (valgt === 'afvist' && afvisningsÅrsag) noteLinjer.push(afvisningsÅrsag);
    if (note.trim()) noteLinjer.push(note.trim());
    const samletNote = noteLinjer.join(' — ') || undefined;

    setSender(true);
    try {
      const res = await fetch('/api/bosteder/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bostedId, status: valgt, note: samletNote }),
      });
      if (res.ok) {
        setBekræftet(true);
        setValgt(null);
        setAfvisningsÅrsag('');
        setNote('');
        onLogget?.();
        setTimeout(() => setBekræftet(false), 3000);
      }
    } finally {
      setSender(false);
    }
  }

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <span className="bosted-detail-kort-titel">Handlinger</span>
      </div>
      <div className="bosted-detail-kort-body" style={{ gap: '1.25rem' }}>

        {/* CRM */}
        <div className="bosted-salg-sektion">
          <p className="bosted-salg-titel">CRM</p>
          <div className="bosted-salg-knapper">
            {MONDAY_URL ? (
              <a href={MONDAY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                <ExternalLink size={14} />
                Åbn i Monday
              </a>
            ) : (
              <button className="btn btn-primary btn-sm" disabled title="Kommer når Monday-write aktiveres">
                <PlusCircle size={14} />
                Opret lead i Monday
              </button>
            )}
          </div>
        </div>

        {/* Kold canvas */}
        <div className="bosted-salg-sektion">
          <p className="bosted-salg-titel">Kold canvas</p>
          <div className="bosted-salg-knapper">
            {KNAPPER.map(({ status, label, icon: Icon, farve }) => (
              <button
                key={status}
                className={`btn btn-sm ${valgt === status ? 'btn-primary' : 'btn-outline'}`}
                style={valgt !== status && farve ? { color: farve, borderColor: farve } : undefined}
                onClick={() => vælgStatus(status)}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {valgt && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {valgt === 'afvist' && (
                <select
                  value={afvisningsÅrsag}
                  onChange={(e) => setAfvisningsÅrsag(e.target.value)}
                  style={{
                    width: '100%', fontSize: 'var(--text-sm)', padding: '0.4rem 0.6rem',
                    border: '1px solid var(--color-border)', borderRadius: '6px',
                    color: afvisningsÅrsag ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    background: 'var(--color-bg-card)',
                  }}
                >
                  <option value="">Vælg årsag til afvisning…</option>
                  {AFVISNINGS_ÅRSAGER.map((å) => (
                    <option key={å} value={å}>{å}</option>
                  ))}
                </select>
              )}
              <textarea
                placeholder={valgt === 'afvist' && afvisningsÅrsag === 'Andet' ? 'Beskriv årsagen…' : 'Tilføj en note (valgfrit)…'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{
                  width: '100%', fontSize: 'var(--text-sm)', padding: '0.4rem 0.6rem',
                  border: '1px solid var(--color-border)', borderRadius: '6px',
                  resize: 'none', color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-card)',
                  display: valgt === 'afvist' && afvisningsÅrsag === '' ? 'none' : undefined,
                }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={gemKontakt}
                disabled={sender || (valgt === 'afvist' && (!afvisningsÅrsag || (afvisningsÅrsag === 'Andet' && !note.trim())))}
                style={{ alignSelf: 'flex-start' }}
              >
                {sender ? <Loader size={14} className="scraper-ikon-kører" /> : <CheckCircle size={14} />}
                Gem
              </button>
            </div>
          )}

          {bekræftet && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success, #16a34a)', marginTop: '0.4rem' }}>
              ✓ Kontakt logget
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
