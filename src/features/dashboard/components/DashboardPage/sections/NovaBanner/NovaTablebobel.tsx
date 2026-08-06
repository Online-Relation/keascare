// src/features/dashboard/components/DashboardPage/sections/NovaBanner/NovaTablebobel.tsx
// Novas talebobbel — viser hvad hun arbejdede på i nattens kørsel

'use client';

import { useEffect, useState } from 'react';
import type { NovaNatsrapport } from '@/app/api/nova/natsrapport/route';

function bygTalebobbel(r: NovaNatsrapport): string {
  const dato = new Date(r.kørtDato);
  const nu = new Date();
  const diffTimer = Math.round((nu.getTime() - dato.getTime()) / 3_600_000);
  const tidSiden = diffTimer < 1
    ? 'lige før'
    : diffTimer < 24
      ? `for ${diffTimer} time${diffTimer === 1 ? '' : 'r'} siden`
      : `for ${Math.floor(diffTimer / 24)} dag${Math.floor(diffTimer / 24) === 1 ? '' : 'e'} siden`;

  const dele: string[] = [];

  if (r.cvrBeriget > 0)
    dele.push(`berigede ${r.cvrBeriget} bosteder med CVR-nummer`);
  if (r.tpBeriget > 0)
    dele.push(`matchede ${r.tpBeriget} bosteder mod Tilbudsportalen`);
  if (r.tpRequeued > 0)
    dele.push(`sendte ${r.tpRequeued} TP-profiler til opdatering`);
  if (r.losMatchet > 0)
    dele.push(`opdaterede LOS-medlemskab for ${r.losMatchet} bosteder`);
  if (r.mondayMatchet > 0)
    dele.push(`synkroniserede ${r.mondayMatchet} Monday-kunder`);

  if (dele.length === 0) {
    return `Jeg kørte ${tidSiden} — ingen nye matches i nat, men alt ser fint ud.`;
  }

  const sætning = dele.length === 1
    ? dele[0]
    : `${dele.slice(0, -1).join(', ')} og ${dele.at(-1)}`;

  const afslutning = r.totalFejl > 0
    ? ` ${r.totalFejl === 1 ? 'Én opgave' : `${r.totalFejl} opgaver`} fejlede undervejs.`
    : ' Alt kørte fint.';

  return `I nat (${tidSiden}) ${sætning}.${afslutning}`;
}

export function NovaTablebobel() {
  const [rapport, setRapport] = useState<NovaNatsrapport | null>(null);
  const [indlæst, setIndlæst] = useState(false);

  useEffect(() => {
    fetch('/api/nova/natsrapport')
      .then((r) => r.json())
      .then((d: { rapport: NovaNatsrapport | null }) => {
        setRapport(d.rapport);
        setIndlæst(true);
      })
      .catch(() => setIndlæst(true));
  }, []);

  if (!indlæst || !rapport) return null;

  return (
    <div className="nova-tablebobel">
      <div className="nova-tablebobel__pil" aria-hidden="true" />
      <p className="nova-tablebobel__tekst">{bygTalebobbel(rapport)}</p>
    </div>
  );
}
