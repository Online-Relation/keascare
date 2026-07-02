'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, PhoneOff, User } from 'lucide-react';

type KontaktLog = {
  id: string;
  bosted_id: string;
  bruger_navn: string;
  status: 'kontaktet' | 'kontakt_senere' | 'afvist';
  note: string | null;
  oprettet_at: string;
};

const statusConfig = {
  kontaktet:      { label: 'Kontaktet',      icon: CheckCircle, cls: 'badge-ingen' },
  kontakt_senere: { label: 'Kontakt senere', icon: Clock,        cls: 'badge-ukendt' },
  afvist:         { label: 'Afvist',         icon: PhoneOff,     cls: 'badge-kritisk' },
};

type Props = {
  bostedId: string;
  opdater?: number;
};

export function KontaktHistorik({ bostedId, opdater }: Props) {
  const [log, setLog] = useState<KontaktLog[]>([]);

  useEffect(() => {
    fetch(`/api/bosteder/kontakt?bostedId=${bostedId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setLog(data); })
      .catch(() => {});
  }, [bostedId, opdater]);

  if (log.length === 0) return null;

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <User size={15} />
        <span className="bosted-detail-kort-titel">Kontakthistorik</span>
      </div>
      <div className="bosted-detail-kort-body" style={{ gap: '0.5rem' }}>
        {log.map((entry) => {
          const cfg = statusConfig[entry.status] ?? statusConfig.kontaktet;
          const Icon = cfg.icon;
          const dato = new Date(entry.oprettet_at).toLocaleDateString('da-DK', {
            day: 'numeric', month: 'short', year: 'numeric',
          });
          return (
            <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${cfg.cls}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                  <Icon size={11} />
                  {cfg.label}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text-primary)' }}>
                  {entry.bruger_navn}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                  {dato}
                </span>
              </div>
              {entry.note && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0.1rem 0 0 0', paddingLeft: '0.1rem' }}>
                  {entry.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
