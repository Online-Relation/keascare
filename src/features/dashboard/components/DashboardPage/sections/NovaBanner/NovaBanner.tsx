'use client';

// src/features/dashboard/components/DashboardPage/sections/NovaBanner/NovaBanner.tsx

import type React from 'react';
import { useMemo, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import type { DashboardData } from '@/features/dashboard/types/dashboard.types';
import type { NovaBesked } from '@/features/nova/types/nova.types';

type NovaStatus = 'aktiv' | 'optaget' | 'fraværende';

function beregnNovaStatus(): NovaStatus {
  const now = new Date();
  const seed = now.getDate() * 100 + now.getHours();
  const r = ((seed * 1103515245 + 12345) & 0x7fffffff) % 100;
  if (r < 60) return 'aktiv';
  if (r < 80) return 'optaget';
  return 'fraværende';
}

const NOVA_STATUS_CONFIG: Record<NovaStatus, { farve: string; label: string }> = {
  aktiv:      { farve: '#22c55e', label: 'Aktiv nu' },
  optaget:    { farve: '#f59e0b', label: 'Optaget' },
  fraværende: { farve: '#94a3b8', label: 'Fraværende' },
};

type Props = { data: DashboardData };

type TidContext = 'morgen' | 'formiddag' | 'dag' | 'eftermiddag' | 'aften' | 'nat';

function getTidContext(): TidContext {
  const h = new Date().getHours();
  if (h >= 5  && h < 9)  return 'morgen';
  if (h >= 9  && h < 12) return 'formiddag';
  if (h >= 12 && h < 14) return 'dag';
  if (h >= 14 && h < 18) return 'eftermiddag';
  if (h >= 18 && h < 23) return 'aften';
  return 'nat';
}

function hilsen(navn: string | null, tid: TidContext): string {
  const fornavn = navn?.split(' ')[0] ?? '';
  const suffix = fornavn ? `, ${fornavn}` : '';
  switch (tid) {
    case 'morgen':      return `Godmorgen${suffix}`;
    case 'formiddag':   return `God formiddag${suffix}`;
    case 'dag':         return `Goddag${suffix}`;
    case 'eftermiddag': return `God eftermiddag${suffix}`;
    case 'aften':       return `Godaften${suffix}`;
    case 'nat':         return `Hej${suffix}`;
  }
}

function novaIntro(tid: TidContext): string {
  switch (tid) {
    case 'morgen':      return 'Her er dit overblik for i dag. Jeg har arbejdet mens du sov og fundet det vigtigste, du bør fokusere på.';
    case 'formiddag':   return 'Her er dit overblik. Jeg har analyseret jeres datakilder i morges og samlet dagens vigtigste signaler.';
    case 'dag':         return 'Her er dit overblik. Jeg holder løbende øje med jeres datakilder og har samlet det vigtigste til dig.';
    case 'eftermiddag': return 'Her er dagens overblik. Jeg har holdt øje med jeres datakilder og prioriteret det vigtigste for dig.';
    case 'aften':       return 'Her er dit overblik. Jeg har analyseret jeres datakilder i dag og samlet de vigtigste fund.';
    case 'nat':         return 'Her er det aktuelle overblik. Jeg arbejder kontinuerligt og har samlet det vigtigste til dig.';
  }
}

function beregnNovaFund(data: DashboardData) {
  const kritiske = data.kpis.find((k) => k.id === 'kritiske-fund');
  const kritiskeAntal = parseInt(kritiske?.value ?? '0', 10);
  const ubearbejdede = data.salgsFunnel.trin.find((t) => t.label === 'Ikke bearbejdet endnu')?.antal ?? 0;
  const kunder = data.salgsFunnel.trin.find((t) => t.label === 'Kunder i Monday')?.antal ?? 0;
  const totalRapporter = data.bosteder.length;
  return { kritiskeAntal, ubearbejdede, kunder, totalRapporter };
}

// --- Ikoner ---

function IconAdvarsel() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconPersoner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}

function IconKalender() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconStjerne() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

const BESKED_IKON: Record<NovaBesked['ikon'], () => React.ReactElement> = {
  advarsel: IconAdvarsel,
  personer:  IconPersoner,
  kalender:  IconKalender,
  stjerne:   IconStjerne,
};

const BESKED_VARIANT_CSS: Record<NovaBesked['variant'], string> = {
  kritisk:  'nova-banner__fund-item--kritisk',
  advarsel: 'nova-banner__fund-item--advarsel',
  neutral:  'nova-banner__fund-item--neutral',
  succes:   'nova-banner__fund-item--succes',
};

// --- Komponent ---

export function NovaBanner({ data }: Props) {
  const { navn, loading } = useBrugerRolle();
  const { kritiskeAntal, ubearbejdede, kunder, totalRapporter } = beregnNovaFund(data);
  const tid = getTidContext();
  const novaStatus = useMemo(() => beregnNovaStatus(), []);
  const statusConfig = NOVA_STATUS_CONFIG[novaStatus];

  const [novaBeskeder, setNovaBeskeder] = useState<NovaBesked[] | null>(null);

  useEffect(() => {
    fetch('/api/nova/beskeder')
      .then((r) => r.json())
      .then((d: { beskeder: NovaBesked[] }) => setNovaBeskeder(d.beskeder ?? []))
      .catch(() => setNovaBeskeder([]));
  }, []);

  // Personaliserede beskeder vises når de er hentet — ellers generiske
  const visNovaBeskeder = novaBeskeder !== null && novaBeskeder.length > 0;

  const generiskeFundItems = [
    kritiskeAntal > 0 ? {
      titel: `${kritiskeAntal} ${kritiskeAntal === 1 ? 'nyt kritisk STPS-tilsyn' : 'nye kritiske STPS-tilsyn'}`,
      sub: 'Alvorlige fund registreret — kræver handling',
      cssVariant: 'nova-banner__fund-item--kritisk',
      Ikon: IconAdvarsel,
    } : null,
    ubearbejdede > 0 ? {
      titel: `${ubearbejdede} ${ubearbejdede === 1 ? 'ny potentiel kunde' : 'nye potentielle kunder'}`,
      sub: 'Matcher jeres malgruppe — ikke bearbejdet endnu',
      cssVariant: 'nova-banner__fund-item--advarsel',
      Ikon: IconPersoner,
    } : null,
    kunder > 0 ? {
      titel: `${kunder} ${kunder === 1 ? 'eksisterende kunde' : 'eksisterende kunder'} i Monday`,
      sub: 'Aktive i jeres CRM',
      cssVariant: 'nova-banner__fund-item--neutral',
      Ikon: IconKalender,
    } : null,
  ].filter(Boolean) as { titel: string; sub: string; cssVariant: string; Ikon: () => React.ReactElement }[];

  return (
    <div className="nova-banner">

      {/* Kolonne 1: Velkomst + fund + CTA */}
      <div className="nova-banner__left">
        <div className="nova-banner__tekst">
          <h1 className="nova-banner__hilsen">
            {loading ? 'Hej' : hilsen(navn, tid)}
          </h1>
          <p className="nova-banner__intro">{novaIntro(tid)}</p>
        </div>

        {visNovaBeskeder ? (
          <ul className="nova-banner__fund-liste">
            {novaBeskeder.map((b) => {
              const Ikon = BESKED_IKON[b.ikon];
              return (
                <li key={b.id} className={`nova-banner__fund-item ${BESKED_VARIANT_CSS[b.variant]}`}>
                  <div className="nova-banner__fund-ikon-wrapper"><Ikon /></div>
                  <div className="nova-banner__fund-tekst-wrapper">
                    <span className="nova-banner__fund-titel">{b.titel}</span>
                    <span className="nova-banner__fund-sub">{b.sub}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : generiskeFundItems.length > 0 ? (
          <ul className="nova-banner__fund-liste">
            {generiskeFundItems.map((f, i) => (
              <li key={i} className={`nova-banner__fund-item ${f.cssVariant}`}>
                <div className="nova-banner__fund-ikon-wrapper"><f.Ikon /></div>
                <div className="nova-banner__fund-tekst-wrapper">
                  <span className="nova-banner__fund-titel">{f.titel}</span>
                  <span className="nova-banner__fund-sub">{f.sub}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <Link href="/dashboard/alle-rapporter?fund=kritisk" className="nova-banner__cta">
          Se mine anbefalinger
        </Link>
      </div>

      {/* Kolonne 2: Nova profil centreret */}
      <div className="nova-banner__center">
        <div className="nova-banner__avatar-wrapper">
          <Image
            src="/images/medarbejdere/nova.webp"
            alt="Nova, Digital Lead Analyst"
            width={120}
            height={120}
            className="nova-banner__avatar"
            priority
          />
          <span
            className="nova-banner__online-dot"
            style={{ backgroundColor: statusConfig.farve }}
            title={statusConfig.label}
            aria-label={`Nova: ${statusConfig.label}`}
          />
        </div>
        <span className="nova-banner__navn">Nova</span>
        <span className="nova-banner__titel">Digital Lead Analyst</span>
        <span className="nova-banner__nova-status-label" style={{ color: statusConfig.farve }}>
          {statusConfig.label}
        </span>
        <span className="nova-banner__status">Overvaager +1.200 datakilder dognet rundt</span>
      </div>

      {/* Kolonne 3: KPI-stack */}
      <div className="nova-banner__kpis">
        <div className="nova-banner__kpi">
          <span className="nova-banner__kpi-tal">{totalRapporter}</span>
          <span className="nova-banner__kpi-label">Rapporter analyseret</span>
        </div>
        <div className="nova-banner__kpi-divider" />
        <div className="nova-banner__kpi">
          <span className="nova-banner__kpi-tal">{ubearbejdede}</span>
          <span className="nova-banner__kpi-label">Nye leads fundet</span>
        </div>
        <div className="nova-banner__kpi-divider" />
        <div className="nova-banner__kpi nova-banner__kpi--alert">
          <span className="nova-banner__kpi-tal">{kritiskeAntal}</span>
          <span className="nova-banner__kpi-label">Kritiske fund identificeret</span>
        </div>
      </div>

    </div>
  );
}
