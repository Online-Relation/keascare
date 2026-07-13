'use client';

// src/features/dashboard/components/DashboardPage/sections/NovaBanner/NovaBanner.tsx

import Image from 'next/image';
import Link from 'next/link';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import type { DashboardData } from '@/features/dashboard/types/dashboard.types';

type Props = {
  data: DashboardData;
};

function hilsen(navn: string | null): string {
  const time = new Date().getHours();
  const fornavn = navn?.split(' ')[0] ?? 'dig';
  if (time < 10) return `Godmorgen, ${fornavn} 👋`;
  if (time < 12) return `God formiddag, ${fornavn} 👋`;
  if (time < 17) return `Goddag, ${fornavn} 👋`;
  return `Godaften, ${fornavn} 👋`;
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

  const fund = [
    kritiskeAntal > 0 && {
      ikon: '⚠️',
      tekst: `${kritiskeAntal} ${kritiskeAntal === 1 ? 'bosted med kritisk STPS-tilsyn' : 'bosteder med kritiske STPS-tilsyn'}`,
      farve: 'text-red-600',
    },
    ubearbejdede > 0 && {
      ikon: '🎯',
      tekst: `${ubearbejdede} ${ubearbejdede === 1 ? 'potentiel kunde ikke bearbejdet endnu' : 'potentielle kunder ikke bearbejdet endnu'}`,
      farve: 'text-amber-600',
    },
    kunder > 0 && {
      ikon: '✅',
      tekst: `${kunder} ${kunder === 1 ? 'eksisterende kunde' : 'eksisterende kunder'} i Monday CRM`,
      farve: 'text-emerald-600',
    },
  ].filter(Boolean) as { ikon: string; tekst: string; farve: string }[];

  return (
    <div className="nova-banner">
      {/* Venstre: velkomst + Nova-besked */}
      <div className="nova-banner__left">
        <h1 className="nova-banner__hilsen">
          {loading ? 'Hej 👋' : hilsen(navn)}
        </h1>
        <p className="nova-banner__intro">
          Jeg har arbejdet mens du sov og analyseret jeres datakilder.
          Her er det vigtigste, du bør fokusere på i dag.
        </p>

        {fund.length > 0 && (
          <ul className="nova-banner__fund-liste">
            {fund.map((f, i) => (
              <li key={i} className="nova-banner__fund-item">
                <span className="nova-banner__fund-ikon">{f.ikon}</span>
                <span className={`nova-banner__fund-tekst ${f.farve}`}>{f.tekst}</span>
              </li>
            ))}
          </ul>
        )}

        <Link href="/dashboard/alle-rapporter?fund=kritisk" className="nova-banner__cta">
          Se mine anbefalinger →
        </Link>
      </div>

      {/* Højre: Nova-profil + KPI'er */}
      <div className="nova-banner__right">
        <div className="nova-banner__profil">
          <div className="nova-banner__avatar-wrapper">
            <Image
              src="/images/medarbejdere/nova.webp"
              alt="Nova – Digital Lead Analyst"
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
            <span className="nova-banner__status">Overvåger +1.200 datakilder døgnet rundt</span>
          </div>
        </div>

        <div className="nova-banner__kpis">
          <div className="nova-banner__kpi">
            <span className="nova-banner__kpi-tal">{totalRapporter}</span>
            <span className="nova-banner__kpi-label">Rapporter analyseret</span>
          </div>
          <div className="nova-banner__kpi">
            <span className="nova-banner__kpi-tal">{ubearbejdede}</span>
            <span className="nova-banner__kpi-label">Nye leads klar</span>
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
