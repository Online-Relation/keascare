'use client';

// src/features/dashboard/components/DashboardPage/sections/NovaBanner/NovaBanner.tsx

import type React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import type { DashboardData } from '@/features/dashboard/types/dashboard.types';
import type { NovaBesked } from '@/features/nova/types/nova.types';

type NovaStatus = 'aktiv' | 'optaget' | 'fraværende';

const NOVA_STATUS_CONFIG: Record<NovaStatus, { farve: string; label: string }> = {
  aktiv:      { farve: '#22c55e', label: 'Aktiv nu' },
  optaget:    { farve: '#f59e0b', label: 'Optaget' },
  fraværende: { farve: '#8b5cf6', label: 'Fraværende' },
};

type NovaAktivitet = {
  status: NovaStatus;
  opgave: string | null;
  erRigtig: boolean;
};

type Props = { data: DashboardData };

function relativTid(isoStreng: string | null): string {
  if (!isoStreng) return 'Ukendt';
  const diffMs = Date.now() - new Date(isoStreng).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return 'Lige nu';
  if (diffMin < 60) return `for ${diffMin} minut${diffMin === 1 ? '' : 'ter'} siden`;
  const diffTimer = Math.floor(diffMin / 60);
  if (diffTimer < 24) return `for ${diffTimer} time${diffTimer === 1 ? '' : 'r'} siden`;
  const diffDage = Math.floor(diffTimer / 24);
  return `for ${diffDage} dag${diffDage === 1 ? '' : 'e'} siden`;
}

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
  const sidstOpdateret = data.sidstOpdateret ?? null;
  return { kritiskeAntal, ubearbejdede, kunder, totalRapporter, sidstOpdateret };
}

// --- Ikoner ---

function IconRapporter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function IconLeads() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  );
}

function IconKritisk() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

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
  const { kritiskeAntal, ubearbejdede, kunder, totalRapporter, sidstOpdateret } = beregnNovaFund(data);
  const tid = getTidContext();

  const [novaBeskeder, setNovaBeskeder] = useState<NovaBesked[] | null>(null);
  const [novaAktivitet, setNovaAktivitet] = useState<NovaAktivitet | null>(null);

  const novaStatus: NovaStatus = novaAktivitet?.status ?? 'aktiv';
  const statusConfig = NOVA_STATUS_CONFIG[novaStatus];
  const erOptaget = novaStatus === 'optaget';
  const erRigtig = novaAktivitet?.erRigtig ?? false;

  useEffect(() => {
    fetch('/api/nova/beskeder')
      .then((r) => r.json())
      .then((d: { beskeder: NovaBesked[] }) => setNovaBeskeder(d.beskeder ?? []))
      .catch(() => setNovaBeskeder([]));
  }, []);

  useEffect(() => {
    function hentAktivitet() {
      fetch('/api/nova/aktivitet')
        .then((r) => r.json())
        .then((d: NovaAktivitet) => setNovaAktivitet(d))
        .catch(() => {});
    }
    hentAktivitet();
    const id = setInterval(hentAktivitet, 30_000);
    return () => clearInterval(id);
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
          <h1 className="nova-banner__hilsen" style={{ visibility: loading ? 'hidden' : 'visible' }}>
            {hilsen(navn, tid)}
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
            width={96}
            height={96}
            className="nova-banner__avatar"
            priority
          />
          {novaAktivitet !== null && (
            <span
              className={`nova-banner__online-dot${erRigtig ? ' nova-banner__online-dot--pulse' : ''}`}
              style={{ backgroundColor: statusConfig.farve }}
              title={statusConfig.label}
              aria-label={`Nova: ${statusConfig.label}`}
            />
          )}
        </div>
        <span className="nova-banner__navn">Nova</span>
        <span className="nova-banner__titel">Digital Lead Analyst</span>
        {novaAktivitet !== null && (
          <span className="nova-banner__nova-status-label" style={{ color: statusConfig.farve }}>
            {statusConfig.label}
          </span>
        )}
        {erOptaget && novaAktivitet?.opgave ? (
          <span className="nova-banner__status nova-banner__status--opgave">
            {novaAktivitet.opgave}
            <span className="nova-banner__blink-dots" aria-hidden="true">...</span>
          </span>
        ) : (
          <span className="nova-banner__status">Overvåger +1.200 datakilder døgnet rundt</span>
        )}
        <span className="nova-banner__sidst-opdateret">
          Sidst opdateret {relativTid(sidstOpdateret)}
        </span>
      </div>

      {/* Kolonne 3: KPI-stack */}
      <div className="nova-banner__kpis">
        <div className="nova-banner__kpi">
          <div className="nova-banner__kpi-header">
            <div className="nova-banner__kpi-ikon"><IconRapporter /></div>
            <span className="nova-banner__kpi-tal">{totalRapporter}</span>
          </div>
          <span className="nova-banner__kpi-label">Rapporter analyseret</span>
        </div>
        <div className="nova-banner__kpi-divider" />
        <div className="nova-banner__kpi">
          <div className="nova-banner__kpi-header">
            <div className="nova-banner__kpi-ikon"><IconLeads /></div>
            <span className="nova-banner__kpi-tal">{ubearbejdede}</span>
          </div>
          <span className="nova-banner__kpi-label">Nye leads fundet</span>
        </div>
        <div className="nova-banner__kpi-divider" />
        <div className="nova-banner__kpi nova-banner__kpi--alert">
          <div className="nova-banner__kpi-header">
            <div className="nova-banner__kpi-ikon"><IconKritisk /></div>
            <span className="nova-banner__kpi-tal">{kritiskeAntal}</span>
          </div>
          <span className="nova-banner__kpi-label">Kritiske fund identificeret</span>
        </div>
      </div>

    </div>
  );
}
