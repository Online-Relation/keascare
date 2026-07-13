'use client';

// src/features/dashboard/components/NotifikationsCenter/NotifikationsCenter.tsx

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import type { Notifikation } from '@/app/api/notifikationer/route';

function relativ(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'lige nu';
  if (min < 60) return `${min} min siden`;
  const t = Math.floor(min / 60);
  if (t < 24) return `${t} t siden`;
  return `${Math.floor(t / 24)} d siden`;
}

const TYPE_FARVE: Record<Notifikation['type'], string> = {
  succes:   '#22c55e',
  fejl:     '#dc2626',
  advarsel: '#f59e0b',
  info:     '#64748b',
};

export function NotifikationsCenter() {
  const { rolle, loading } = useBrugerRolle();
  const [åben, setÅben] = useState(false);
  const [notifikationer, setNotifikationer] = useState<Notifikation[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Kun synlig for development-rolle
  const visNotif = !loading && rolle === 'development';

  useEffect(() => {
    if (!visNotif) return;
    fetch('/api/notifikationer')
      .then((r) => r.json())
      .then((d: { notifikationer: Notifikation[] }) => setNotifikationer(d.notifikationer ?? []))
      .catch(() => {});
  }, [visNotif]);

  // Luk ved klik udenfor
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setÅben(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!visNotif) return (
    <button className="btn btn-ghost btn-sm" aria-label="Notifikationer" disabled style={{ opacity: 0.4 }}>
      <Bell size={15} />
    </button>
  );

  const ulæste = notifikationer.filter((n) => !n.læst).length;
  const fejl = notifikationer.filter((n) => n.type === 'fejl').length;

  return (
    <div ref={ref} className="notif-center">
      <button
        className="btn btn-ghost btn-sm notif-center__knap"
        aria-label="Notifikationer"
        aria-expanded={åben}
        onClick={() => setÅben((v) => !v)}
      >
        <Bell size={15} />
        {(ulæste > 0 || fejl > 0) && (
          <span
            className="notif-center__badge"
            style={{ backgroundColor: fejl > 0 ? '#dc2626' : '#22c55e' }}
          >
            {fejl > 0 ? fejl : ulæste}
          </span>
        )}
      </button>

      {åben && (
        <div className="notif-center__dropdown" role="dialog" aria-label="Notifikationscenter">
          <div className="notif-center__header">
            <span className="notif-center__titel">Systemnotifikationer</span>
            <span className="notif-center__rolle-chip">DEV</span>
          </div>

          {notifikationer.length === 0 ? (
            <div className="notif-center__tom">Ingen nylige hændelser</div>
          ) : (
            <ul className="notif-center__liste">
              {notifikationer.map((n) => (
                <li key={n.id} className="notif-center__item">
                  <span
                    className="notif-center__dot"
                    style={{ backgroundColor: TYPE_FARVE[n.type] }}
                  />
                  <div className="notif-center__tekst">
                    <span className="notif-center__item-titel">{n.titel}</span>
                    <span className="notif-center__item-besked">{n.besked}</span>
                    <span className="notif-center__item-tid">{relativ(n.tidspunkt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
