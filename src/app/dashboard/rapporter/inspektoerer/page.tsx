// src/app/dashboard/rapporter/inspektoerer/page.tsx

import { hentInspektoerStatistik } from '@/features/stps/services/StpsInspektoerService';
import { InspektoerOversigt } from '@/features/stps/components/InspektoerOversigt';

export const dynamic = 'force-dynamic';

export default async function InspektoererPage() {
  const inspektoerer = await hentInspektoerStatistik();

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-primary)', margin: 0 }}>
          STPS-inspektører
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Oversigt over STPS-medarbejdere der har gennemført tilsyn — sorteret efter antal tilsyn.
        </p>
      </div>

      <div style={{ marginBottom: '0.75rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        {inspektoerer.length} inspektører fundet på tværs af {inspektoerer.reduce((s, i) => s + i.antal, 0)} tilsynsrapporter
      </div>

      <InspektoerOversigt inspektoerer={inspektoerer} />
    </div>
  );
}
