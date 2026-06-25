// src/features/dashboard/components/BostedDetailPage/sections/BostedFundsoversigt/BostedFundsoversigt.tsx

import { ShieldAlert, Info, FileText } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';

type BostedFundsoversigtProps = {
  bosted: BostedDetail;
};

function rensLinjeer(tekst: string): string {
  return tekst
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/--\s*\d+\s*af\s*\d+\s*--/gi, '')
    .replace(/Tilsynsrapport\n.+\nSide \d+ af \d+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function BostedFundsoversigt({ bosted }: BostedFundsoversigtProps) {
  if (!bosted.pdfBehandlet) {
    return (
      <div className="bosted-fundsoversigt-kort">
        <div className="bosted-detail-kort-header">
          <ShieldAlert size={15} />
          <span className="bosted-detail-kort-titel">Fundsoversigt fra rapporten</span>
        </div>
        <div className="bosted-detail-kort-body">
          <div className="bosted-detail-mangler-boks">
            <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>Rapportdetaljer er endnu ikke hentet. Kør detail-scraperen for at berige rapporten.</span>
          </div>
        </div>
      </div>
    );
  }

  const harVurdering = !!bosted.pdfVurdering;
  const harFund = !!bosted.pdfFund;

  if (!harVurdering && !harFund) {
    return (
      <div className="bosted-fundsoversigt-kort">
        <div className="bosted-detail-kort-header">
          <ShieldAlert size={15} />
          <span className="bosted-detail-kort-titel">Fundsoversigt fra rapporten</span>
        </div>
        <div className="bosted-detail-kort-body">
          <div className="bosted-detail-mangler-boks">
            <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>Indhold kunne ikke udtrækkes automatisk fra PDF. Åbn PDF direkte for at se fund og vurdering.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bosted-fundsoversigt-kort">
      <div className="bosted-detail-kort-header">
        <ShieldAlert size={15} />
        <span className="bosted-detail-kort-titel">Fundsoversigt fra rapporten</span>
      </div>

      <div className="bosted-fundsoversigt-body">
        {harVurdering && (
          <div className="bosted-fundsoversigt-sektion">
            <div className="bosted-fundsoversigt-sektion-header">
              <FileText size={13} />
              <span>Samlet vurdering</span>
            </div>
            <p className="bosted-fundsoversigt-tekst">
              {rensLinjeer(bosted.pdfVurdering!)}
            </p>
          </div>
        )}

        {harFund && (
          <div className="bosted-fundsoversigt-sektion bosted-fundsoversigt-sektion--fund">
            <div className="bosted-fundsoversigt-sektion-header">
              <FileText size={13} />
              <span>Fund ved tilsynet</span>
            </div>
            <p className="bosted-fundsoversigt-tekst">
              {rensLinjeer(bosted.pdfFund!)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
