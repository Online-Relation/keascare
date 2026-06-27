// src/features/dashboard/components/BostedDetailPage/sections/BostedHeader/BostedHeader.tsx

'use client';

import { MapPin, Globe, ClipboardList, Star } from 'lucide-react';
import type { BostedDetail, StpsFundNiveau } from '@/features/dashboard/types/dashboard.types';
import { useFavoritter } from '@/features/favoritter/hooks/useFavoritter';
import { DataKvalitetBadge } from '@/features/dashboard/components/DataKvalitetBadge';

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
  const { erFavorit, toggleFavorit } = useFavoritter();
  const erStjernet = erFavorit(bosted.id);

  const dato = bosted.rapportDato
    ? new Date(bosted.rapportDato).toLocaleDateString('da-DK', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div>
      <div className="bosted-detail-header">
        <div className="bosted-detail-header-top">
          <div style={{ flex: 1, minWidth: 0 }}>
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

          <button
            className={`favorit-stjerne-knap${erStjernet ? ' aktiv' : ''}`}
            onClick={() => toggleFavorit({
              id: bosted.id,
              navn: bosted.navn,
              kommune: bosted.kommune ?? null,
              fundNiveau: bosted.fundNiveau,
              rapportDato: bosted.rapportDato,
            })}
            aria-label={erStjernet ? 'Fjern fra fulgte' : 'Tilføj til fulgte'}
            title={erStjernet ? 'Følger dette bosted' : 'Følg dette bosted'}
            style={{ flexShrink: 0 }}
          >
            <Star size={18} fill={erStjernet ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="bosted-detail-header-badges">
          <span className={`badge ${fundBadgeKlasse[bosted.fundNiveau]}`}>
            <span className="badge-dot" />
            {fundLabels[bosted.fundNiveau]}
          </span>
          {bosted.mondayKunde === 'kunde' && (
            <span className="badge badge-kunde" title={`Monday: ${bosted.mondayGruppe ?? ''}`}>
              <span className="badge-dot" />
              Kunde i Monday
            </span>
          )}
          <DataKvalitetBadge dataKvalitet={bosted.dataKvalitet} vis="fuld" />
        </div>
      </div>
    </div>
  );
}
