'use client';

// src/features/systemstatus/components/SystemStatusPage/SystemStatusPage.tsx

import { DataOverblik } from './sections/DataOverblik/DataOverblik';
import { ScraperCountdowns } from './sections/ScraperCountdowns/ScraperCountdowns';
import { SenesteBosteder } from './sections/SenesteBosteder/SenesteBosteder';
import { Lock } from 'lucide-react';

export function SystemStatusPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>

      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text)' }}>Systemstatus</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Overblik over dataindsamling, scraping og hvad der er i systemet.
        </p>
      </div>

      <section>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', marginBottom: '0.75rem' }}>Dataoverblik</h2>
        <DataOverblik />
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', marginBottom: '0.75rem' }}>CVR-signaler — Nye bosted-registreringer</h2>
        <div className="dashboard-kort" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <Lock size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '0.15rem' }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 'var(--fw-medium)', fontSize: 'var(--text-sm)' }}>Afventer adgang til CVR-distributionssystemet</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Når CVR_USER og CVR_PASS er sat op, vises her automatisk nye bosteder (§107, §108, §108a)
              der er registreret i CVR-registret inden for de seneste 30 dage.
              Kontakt Charlotte Schierbeck hos Erhvervsstyrelsen for adgang.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', marginBottom: '0.75rem' }}>Næste planlagte kørsel</h2>
        <ScraperCountdowns />
      </section>

      {/* <section>
        <SenesteBosteder />
      </section> */}

    </div>
  );
}
