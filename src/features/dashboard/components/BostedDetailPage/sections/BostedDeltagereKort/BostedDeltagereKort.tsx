'use client';

// src/features/dashboard/components/BostedDetailPage/sections/BostedDeltagereKort/BostedDeltagereKort.tsx

import Link from 'next/link';
import { Users } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';
import type { TilsynDeltager } from '@/features/stps/scraper/StpsPdfParser';
import { InspektoerAvatar } from '@/features/stps/components/InspektoerSide/InspektoerAvatar';
import { navnTilSlug } from '@/features/stps/services/StpsInspektoerService';

type Props = { bosted: BostedDetail };

function erPersonNavn(navn: string): boolean {
  const n = navn.toLowerCase().trim();
  const ord = navn.trim().split(/\s+/);
  if (ord.length < 2 || ord.length > 4) return false;
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[0])) return false;
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[1])) return false;
  for (const o of ord) {
    if (o.length > 2 && /[A-ZÆØÅ]/.test(o.slice(1))) return false;
  }
  const BOSTEDSORD = [
    'hjem', 'center', 'kollegiet', 'tilbud', 'stedet', 'huset', 'husene',
    'gård', 'gaard', 'bofællesskab', 'boform', 'bolig', 'bosted', 'botilbud',
    'boenhed', 'institution', 'behandling', 'ungdoms', 'børne', 'omsorg',
    'skolehjem', 'bostøtte', 'forsorgshjem', 'socialpsykia', 'enhed',
  ];
  for (const o of ord) {
    const ol = o.toLowerCase().replace(/[^a-zæøå]/g, '');
    const HELE = new Set(['vej','gade','alle','stræde','plads','have','haven','hus','bakken','care','villa','sporet','verden','fonden','foreningen','selvejende','døgn','kvarter','omsorg','herberg']);
    if (HELE.has(ol)) return false;
    if (BOSTEDSORD.some((s) => ol.includes(s))) return false;
  }
  if (/\b(bolig|bofæl|botilbud|bosted|behandling|omsorg|selvejende|ungdoms|forsorg|socialpsykia)\b/.test(n)) return false;
  return true;
}

function DeltagerRække({ deltager }: { deltager: TilsynDeltager }) {
  const erPerson = erPersonNavn(deltager.navn);
  const slug = erPerson ? navnTilSlug(deltager.navn) : null;

  const avatar = erPerson ? (
    <InspektoerAvatar navn={deltager.navn} slug={slug!} size={36} />
  ) : (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: 'var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, color: 'var(--color-text-muted)',
    }}>
      {deltager.navn.slice(0, 1).toUpperCase()}
    </div>
  );

  const tekst = (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
        {deltager.navn}
      </div>
      {deltager.titel && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
          {deltager.titel}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      {avatar}
      {slug ? (
        <Link href={`/dashboard/rapporter/inspektoerer/${slug}`} style={{ textDecoration: 'none' }}>
          {tekst}
        </Link>
      ) : tekst}
    </div>
  );
}

export function BostedDeltagereKort({ bosted }: Props) {
  const deltagere = bosted.tilsynDeltagereStps;
  if (!deltagere || deltagere.length === 0) return null;

  return (
    <div className="bosted-detail-kort" style={{ marginTop: '1.25rem' }}>
      <div className="bosted-detail-kort-header">
        <Users size={15} />
        <span className="bosted-detail-kort-titel">STPS-inspektører</span>
      </div>
      <div className="bosted-detail-kort-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {deltagere.map((d, i) => (
          <DeltagerRække key={i} deltager={d} />
        ))}
      </div>
    </div>
  );
}
