// src/features/dashboard/components/BostedDetailPage/sections/BostedHeader/BostedHeader.tsx

'use client';

import { useState } from 'react';
import { MapPin, Star, Crown } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';
import type { KundePakke } from '@/features/monday/services/MondayProdukterService';
import { useFavoritter } from '@/features/favoritter/hooks/useFavoritter';
import { DataKvalitetBadge } from '@/features/dashboard/components/DataKvalitetBadge';
import { VarsletTilsynKnap } from '@/features/varsletTilsyn/components/VarsletTilsynKnap';

type BostedHeaderProps = {
  bosted: BostedDetail;
  pakker?: KundePakke[];
  varslingId?: string | null;
  onVarslingToggle?: (nytId: string | null) => void;
};

async function toggleGigantApi(id: string, næsteVærdi: boolean) {
  await fetch('/api/bosteder/gigant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, erGigant: næsteVærdi }),
  });
}

export function BostedHeader({ bosted, pakker = [], varslingId = null, onVarslingToggle }: BostedHeaderProps) {
  const { erFavorit, toggleFavorit } = useFavoritter();
  const erStjernet = erFavorit(bosted.id);
  const [erGigant, setErGigant] = useState(bosted.erGigant);

  return (
    <div>
      <div className="bosted-detail-header">
        <div className="bosted-detail-header-top">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="bosted-detail-navn">{bosted.navn}</h1>
            {bosted.kommune && (
              <div className="bosted-detail-meta">
                <span className="bosted-detail-meta-item">
                  <MapPin size={13} />
                  {bosted.kommune}
                </span>
              </div>
            )}
          </div>

          {/* Varslet tilsyn, gigant og favorit side om side */}
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
            <VarsletTilsynKnap
              bostedId={bosted.id}
              bostedNavn={bosted.navn}
              kommune={bosted.kommune ?? null}
              senesteRapportDato={bosted.rapportDato ?? null}
              varslingId={varslingId}
              onToggle={onVarslingToggle}
            />

            <button
              className={`gigant-knap${erGigant ? ' aktiv' : ''}`}
              onClick={() => {
                const ny = !erGigant;
                setErGigant(ny);
                toggleGigantApi(bosted.id, ny);
              }}
              aria-label={erGigant ? 'Fjern gigant-markering' : 'Markér som gigant'}
              title={erGigant ? 'Gigant — klik for at fjerne' : 'Markér som gigant'}
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
            >
              <Star size={18} fill={erStjernet ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Badge-række: kun gigant + datakvalitet */}
        <div className="bosted-detail-header-badges" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          {erGigant && (
            <span className="badge badge-gigant">
              <Crown size={11} fill="currentColor" style={{ marginRight: '0.25rem', flexShrink: 0 }} />
              Gigant
            </span>
          )}
          <DataKvalitetBadge dataKvalitet={bosted.dataKvalitet} vis="fuld" />
        </div>
      </div>
    </div>
  );
}
