'use client';

import { useEffect, useState } from 'react';

type Status = {
  stps: { total: number; nyeIgår: number; nyeUge: number };
  tp: { total: number; manglerDetaljer: number; matchetModStps: number };
  cvr: { har: number; mangler: number; harAnsatte: number };
  monday: { matchet: number };
};

function StatKort({ titel, linjer }: { titel: string; linjer: { tekst: string; fremhæv?: boolean }[] }) {
  return (
    <div className="dashboard-kort" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{titel}</p>
      {linjer.map((l, i) => (
        <p key={i} style={{ fontSize: 'var(--text-sm)', color: l.fremhæv ? 'var(--color-text)' : 'var(--color-text-secondary)', fontWeight: l.fremhæv ? 'var(--fw-medium)' : undefined }}>
          {l.tekst}
        </p>
      ))}
    </div>
  );
}

function Delta({ n }: { n: number }) {
  if (n === 0) return <span style={{ color: 'var(--color-text-muted)' }}>ingen ændring siden igår</span>;
  return <span style={{ color: n > 0 ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)' }}>+{n} siden igår</span>;
}

export function DataOverblik() {
  const [data, setData] = useState<Status | null>(null);

  useEffect(() => {
    const visFilter = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith('keascare-vis-filter='))?.split('=')[1] ?? 'alle';
    fetch(`/api/system/status?visFilter=${visFilter}`).then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Henter data...</p>;

  const tpUdenMatch = data.tp.total - data.tp.matchetModStps;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1rem' }}>
      <StatKort titel="STPS Tilsynsrapporter" linjer={[
        { tekst: `Der er i alt ${data.stps.total} tilsynsrapporter i systemet.`, fremhæv: true },
        { tekst: <><Delta n={data.stps.nyeIgår} /> — {data.stps.nyeUge} nye den seneste uge.</> as unknown as string },
      ]} />

      <StatKort titel="Tilbudsportalen" linjer={[
        { tekst: `${data.tp.total} tilbud er hentet fra Tilbudsportalen.`, fremhæv: true },
        { tekst: `${data.tp.matchetModStps} af dem er matchet med en STPS-rapport.` },
        { tekst: tpUdenMatch > 0
          ? `${tpUdenMatch} tilbud har endnu ingen STPS-rapport — de er ikke i tilsynssystemet.`
          : 'Alle tilbud er matchet med en STPS-rapport.' },
        { tekst: data.tp.manglerDetaljer > 0
          ? `${data.tp.manglerDetaljer} tilbud mangler detaljer (muligvis Cloudflare-blokeret).`
          : 'Alle tilbud har detaljer hentet ✓' },
      ]} />

      <StatKort titel="CVR-register" linjer={[
        { tekst: `${data.cvr.har} bosteder har et CVR-nummer i systemet.`, fremhæv: true },
        { tekst: data.cvr.mangler > 0
          ? `${data.cvr.mangler} bosteder mangler CVR — de kan ikke matches mod Tilbudsportalen.`
          : 'Alle bosteder har CVR ✓' },
        { tekst: `${data.cvr.harAnsatte} bosteder har ansatte-data fra CVR.` },
      ]} />

      <StatKort titel="Monday CRM" linjer={[
        { tekst: `${data.monday.matchet} bosteder er matchet som kunder i Monday.`, fremhæv: true },
        { tekst: `${data.stps.total - data.monday.matchet} bosteder i systemet er ikke kunder endnu.` },
      ]} />
    </div>
  );
}
