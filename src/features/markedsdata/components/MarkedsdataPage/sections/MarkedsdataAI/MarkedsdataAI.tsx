// src/features/markedsdata/components/MarkedsdataPage/sections/MarkedsdataAI/MarkedsdataAI.tsx

'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import type { AiAnalyse } from '@/features/markedsdata/services/AiAnalyseService';

type Props = {
  analyse: AiAnalyse | null;
};

export function MarkedsdataAI({ analyse }: Props) {
  const { rolle } = useBrugerRolle();
  const [kører, setKører] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  const kanOpdatere = rolle === 'development' || rolle === 'direktør';

  async function opdaterAnalyse() {
    setKører(true);
    setFejl(null);
    try {
      const res = await fetch('/api/markedsdata/ai-analyse', { method: 'POST' });
      if (!res.ok) throw new Error('Serverfejl');
      window.location.reload();
    } catch {
      setFejl('Analyse fejlede – prøv igen om lidt.');
      setKører(false);
    }
  }

  const dato = analyse?.genereret_dato
    ? new Date(analyse.genereret_dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="md-ai-kort">
      <div className="md-ai-header">
        <Sparkles size={16} />
        <span className="md-ai-label">AI-overblik</span>
        {dato && <span className="md-ai-dato">Opdateret {dato}</span>}
        {kanOpdatere && (
          <button
            className="md-ai-refresh"
            onClick={opdaterAnalyse}
            disabled={kører}
            title="Generer ny analyse"
          >
            <RefreshCw size={13} className={kører ? 'md-ai-spin' : ''} />
            {kører ? 'Genererer...' : 'Opdater nu'}
          </button>
        )}
      </div>

      {analyse ? (
        <p className="md-ai-tekst">{analyse.tekst}</p>
      ) : (
        <p className="md-ai-tekst md-ai-tekst--mangler">
          Ingen analyse endnu. Analysen genereres automatisk den 1. i hver måned.
          {kanOpdatere && ' Klik "Opdater nu" for at generere med det samme.'}
        </p>
      )}

      {fejl && <p className="md-ai-fejl">{fejl}</p>}

      <p className="md-ai-note">
        Analyse baseret på STPS-rapporter, Tilbudsportalen og Danmarks Statistik · Opdateres månedligt
        {analyse?.model ? ` · ${analyse.model}` : ''}
      </p>
    </div>
  );
}
