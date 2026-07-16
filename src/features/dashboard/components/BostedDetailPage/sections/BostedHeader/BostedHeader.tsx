// src/features/dashboard/components/BostedDetailPage/sections/BostedHeader/BostedHeader.tsx

'use client';

import { useState } from 'react';
import { MapPin, Globe, ClipboardList, Star, Crown } from 'lucide-react';
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

async function toggleGigantApi(id: string, næsteVærdi: boolean) {
  await fetch('/api/bosteder/gigant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, erGigant: næsteVærdi }),
  });
}

export function BostedHeader({ bosted }: BostedHeaderProps) {
  const { erFavorit, toggleFavorit } = useFavoritter();
  const erStjernet = erFavorit(bosted.id);
  const [erGigant, setErGigant] = useState(bosted.erGigant);

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
            className={`gigant-knap${erGigant ? ' aktiv' : ''}`}
            onClick={() => {
              const ny = !erGigant;
              setErGigant(ny);
              toggleGigantApi(bosted.id, ny);
            }}
            aria-label={erGigant ? 'Fjern gigant-markering' : 'Markér som gigant'}
            title={erGigant ? 'Gigant — klik for at fjerne' : 'Markér som gigant'}
            style={{ flexShrink: 0 }}
          >
            <Crown size={18} fill={erGigant ? 'currentColor' : 'none'} />
          </button>

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
          {erGigant && (
            <span className="badge badge-gigant">
              <Crown size={11} fill="currentColor" style={{ marginRight: '0.25rem', flexShrink: 0 }} />
              Gigant
            </span>
          )}
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
