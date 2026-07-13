'use client';

// src/features/dashboard/components/DashboardPage/sections/NovaBanner/NovaBanner.tsx

import Image from 'next/image';
import Link from 'next/link';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import type { DashboardData } from '@/features/dashboard/types/dashboard.types';

type Props = {
  data: DashboardData;
};

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
    case 'morgen':
      return 'Jeg har arbejdet mens du sov. Her er det vigtigste, du bør fokusere på i dag.';
    case 'formiddag':
      return 'Jeg har analyseret jeres datakilder i morges. Her er status for dagen.';
    case 'dag':
      return 'Jeg holder løbende øje med jeres datakilder. Her er det seneste overblik.';
    case 'eftermiddag':
      return 'Jeg har holdt øje hele dagen. Her er hvad der kræver din opmærksomhed.';
    case 'aften':
      return 'Jeg har analyseret jeres datakilder i dag. Her er dagens vigtigste fund.';
    case 'nat':
      return 'Jeg arbejder også om natten. Her er det aktuelle overblik.';
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

export function NovaBanner({ data }: Props) {
  const { navn, loading } = useBrugerRolle();
  const { kritiskeAntal, ubearbejdede, kunder, totalRapporter } = beregnNovaFund(data);
  const tid = getTidContext();

  const fund = [
    kritiskeAntal > 0 && {
      tekst: `${kritiskeAntal} ${kritiskeAntal === 1 ? 'bosted med kritisk STPS-tilsyn' : 'bosteder med kritiske STPS-tilsyn'}`,
      variant: 'kritisk' as const,
    },
    ubearbejdede > 0 && {
      tekst: `${ubearbejdede} ${ubearbejdede === 1 ? 'potentiel kunde ikke bearbejdet endnu' : 'potentielle kunder ikke bearbejdet endnu'}`,
      variant: 'advarsel' as const,
    },
    kunder > 0 && {
      tekst: `${kunder} ${kunder === 1 ? 'eksisterende kunde' : 'eksisterende kunder'} i Monday CRM`,
      variant: 'neutral' as const,
    },
  ].filter(Boolean) as { tekst: string; variant: 'kritisk' | 'advarsel' | 'neutral' }[];

  return (
    <div className="nova-banner">
      <div className="nova-banner__left">
        <h1 className="nova-banner__hilsen">
          {loading ? 'Hej' : hilsen(navn, tid)}
        </h1>
        <p className="nova-banner__intro">
          {novaIntro(tid)}
        </p>

        {fund.length > 0 && (
          <ul className="nova-banner__fund-liste">
            {fund.map((f, i) => (
              <li key={i} className={`nova-banner__fund-item nova-banner__fund-item--${f.variant}`}>
                <span className="nova-banner__fund-dot" />
                <span className="nova-banner__fund-tekst">{f.tekst}</span>
              </li>
            ))}
          </ul>
        )}

        <Link href="/dashboard/alle-rapporter?fund=kritisk" className="nova-banner__cta">
          Se mine anbefalinger
        </Link>
      </div>

      <div className="nova-banner__right">
        <div className="nova-banner__profil">
          <div className="nova-banner__avatar-wrapper">
            <Image
              src="/images/medarbejdere/nova.webp"
              alt="Nova, Digital Lead Analyst"
              width={96}
              height={96}
              className="nova-banner__avatar"
              priority
            />
            <span className="nova-banner__online-dot" aria-label="Nova er aktiv" />
          </div>
          <div className="nova-banner__profil-info">
            <span className="nova-banner__navn">Nova</span>
            <span className="nova-banner__titel">Digital Lead Analyst</span>
            <span className="nova-banner__status">Overvager +1.200 datakilder dognet rundt</span>
          </div>
        </div>

        <div className="nova-banner__kpis">
          <div className="nova-banner__kpi">
            <span className="nova-banner__kpi-tal">{totalRapporter}</span>
            <span className="nova-banner__kpi-label">Rapporter analyseret</span>
          </div>
          <div className="nova-banner__kpi">
            <span className="nova-banner__kpi-tal">{ubearbejdede}</span>
            <span className="nova-banner__kpi-label">Leads klar</span>
          </div>
          <div className="nova-banner__kpi nova-banner__kpi--alert">
            <span className="nova-banner__kpi-tal">{kritiskeAntal}</span>
            <span className="nova-banner__kpi-label">Kritiske fund</span>
          </div>
        </div>
      </div>
    </div>
  );
}
