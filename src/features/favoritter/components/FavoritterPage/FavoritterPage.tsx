// src/features/favoritter/components/FavoritterPage/FavoritterPage.tsx

'use client';

import Link from 'next/link';
import { Star, MapPin, ChevronRight } from 'lucide-react';
import { useFavoritter } from '@/features/favoritter/hooks/useFavoritter';

const fundLabels: Record<string, string> = {
  kritisk: 'Kritiske fund',
  stoerre: 'Større fund',
  mindre:  'Mindre fund',
  ingen:   'Ingen fund',
  ukendt:  'Ukendt',
};

const fundBadgeKlasse: Record<string, string> = {
  kritisk: 'badge-kritisk',
  stoerre: 'badge-stoerre',
  mindre:  'badge-mindre',
  ingen:   'badge-ingen',
  ukendt:  'badge-ukendt',
};

export function FavoritterPage() {
  const { favoritter, fjernFavorit } = useFavoritter();

  return (
    <main className="dashboard-content">
      <div className="favoritter-header">
        <h1 className="favoritter-titel">Fulgte bosteder</h1>
        <p className="favoritter-beskrivelse">
          Bosteder du har markeret med stjerne for nem opfølgning.
        </p>
      </div>

      {favoritter.length === 0 ? (
        <div className="favoritter-tom">
          <Star size={32} strokeWidth={1.5} />
          <p>Du følger ingen bosteder endnu.</p>
          <p>Tryk på stjernen på et bosted for at tilføje det her.</p>
        </div>
      ) : (
        <div className="favoritter-liste">
          {favoritter.map((bosted) => {
            const dato = bosted.rapportDato
              ? new Date(bosted.rapportDato).toLocaleDateString('da-DK', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
              : null;

            return (
              <div key={bosted.id} className="favorit-kort">
                <Link href={`/dashboard/bosteder/${bosted.id}`} className="favorit-kort-link">
                  <div className="favorit-kort-info">
                    <span className="favorit-navn">{bosted.navn}</span>
                    {bosted.kommune && (
                      <span className="favorit-kommune">
                        <MapPin size={12} />
                        {bosted.kommune}
                      </span>
                    )}
                    {dato && <span className="favorit-dato">Rapport: {dato}</span>}
                  </div>
                  <div className="favorit-kort-højre">
                    {bosted.fundNiveau && (
                      <span className={`badge ${fundBadgeKlasse[bosted.fundNiveau] ?? 'badge-ukendt'}`}>
                        <span className="badge-dot" />
                        {fundLabels[bosted.fundNiveau] ?? 'Ukendt'}
                      </span>
                    )}
                    <ChevronRight size={16} className="favorit-pil" />
                  </div>
                </Link>
                <button
                  className="favorit-fjern"
                  onClick={() => fjernFavorit(bosted.id)}
                  aria-label="Fjern fra fulgte"
                >
                  <Star size={15} fill="currentColor" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
