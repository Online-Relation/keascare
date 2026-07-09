'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import type { MondayKundeItem } from '@/features/monday/types/monday.types';
import { KunderKpier } from './sections/KunderKpier/KunderKpier';
import { KunderVækstGraf } from './sections/KunderVækstGraf/KunderVækstGraf';
import { ForløbsansvarligGraf } from './sections/ForløbsansvarligGraf';
import { KunderTabel } from './sections/KunderTabel/KunderTabel';
import { KunderKort } from './sections/KunderKort';
import { AfsluttedeKunderTabel } from './sections/AfsluttedeKunderTabel';

export function KunderPage() {
  const [kunder, setKunder] = useState<MondayKundeItem[]>([]);
  const [matchAntal, setMatchAntal] = useState<number | null>(null);
  const [loader, setLoader] = useState(true);
  const [fejl, setFejl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/monday/kunder')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setKunder(data.kunder);
        else setFejl(data.fejl);
      })
      .catch(() => setFejl('Kunne ikke hente kunder'))
      .finally(() => setLoader(false));

    fetch('/api/monday/match-antal')
      .then((r) => r.json())
      .then((d) => setMatchAntal(d.antal ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="kunder-layout">
      <div className="kunder-header">
        <Users size={20} />
        <div>
          <h1 className="kunder-titel">Kunder</h1>
          <p className="kunder-undertitel">Aktive og nye bostedskunder fra Monday CRM</p>
        </div>
      </div>

      {loader && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Henter kunder fra Monday…</p>}
      {fejl && <p style={{ color: 'var(--color-accent)', fontSize: 'var(--text-sm)' }}>{fejl}</p>}

      {!loader && !fejl && (
        <>
          <KunderKpier kunder={kunder} matchAntal={matchAntal} />
          <KunderVækstGraf kunder={kunder} />
          <ForløbsansvarligGraf kunder={kunder} />
          <KunderTabel kunder={kunder} />
          <AfsluttedeKunderTabel kunder={kunder} />
          <KunderKort />
        </>
      )}
    </div>
  );
}
