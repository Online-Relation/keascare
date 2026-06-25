// src/features/dashboard/components/BostedDetailPage/sections/BostedHeader/BostedHeader.tsx

import Link from 'next/link';
import { ChevronLeft, MapPin, Globe, ClipboardList } from 'lucide-react';
import type { BostedDetail, StpsFundNiveau } from '@/features/dashboard/types/dashboard.types';

type BostedHeaderProps = {
  bosted: BostedDetail;
};

const fundLabels: Record<StpsFundNiveau, string> = {
  kritisk: 'Kritiske fund',
  stoerre: 'Større fund',
  mindre:  'Mindre fund',
  ingen:   'Ingen fund',
  ukendt:  'Ukendt',
};

const fundBadgeKlasse: Record<StpsFundNiveau, string> = {
  kritisk: 'badge-kritisk',
  stoerre: 'badge-stoerre',
  mindre:  'badge-mindre',
  ingen:   'badge-ingen',
  ukendt:  'badge-ukendt',
};

export function BostedHeader({ bosted }: BostedHeaderProps) {
  const dato = bosted.rapportDato
    ? new Date(bosted.rapportDato).toLocaleDateString('da-DK', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div>
      <Link href="/dashboard" className="bosted-detail-back">
        <ChevronLeft size={16} />
        Tilbage til oversigt
      </Link>

      <div className="bosted-detail-header">
        <div className="bosted-detail-header-top">
          <div>
            <h1 className="bosted-detail-navn">{bosted.navn}</h1>
            <div className="bosted-detail-meta">
              {bosted.kommune && (
                <span className="bosted-detail-meta-item">
                  <MapPin size={13} />
                  {bosted.kommune}
                </span>
              )}
              {bosted.kommune && bosted.region && (
                <span className="bosted-detail-meta-sep">·</span>
              )}
              {bosted.region && (
                <span className="bosted-detail-meta-item">
                  <Globe size={13} />
                  {bosted.region}
                </span>
              )}
              {bosted.tilsynsform && (
                <>
                  <span className="bosted-detail-meta-sep">·</span>
                  <span className="bosted-detail-meta-item">
                    <ClipboardList size={13} />
                    {bosted.tilsynsform}
                  </span>
                </>
              )}
              {dato && (
                <>
                  <span className="bosted-detail-meta-sep">·</span>
                  <span className="bosted-detail-meta-item">{dato}</span>
                </>
              )}
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <span className={`badge ${fundBadgeKlasse[bosted.fundNiveau]}`}>
              <span className="badge-dot" />
              {fundLabels[bosted.fundNiveau]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
