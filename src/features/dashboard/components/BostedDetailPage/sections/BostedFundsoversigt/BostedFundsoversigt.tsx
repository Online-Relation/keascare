// src/features/dashboard/components/BostedDetailPage/sections/BostedFundsoversigt/BostedFundsoversigt.tsx

import { ShieldAlert, Info } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';

type BostedFundsoversigtProps = {
  bosted: BostedDetail;
};

export function BostedFundsoversigt({ bosted }: BostedFundsoversigtProps) {
  if (!bosted.pdfBehandlet) {
    return (
      <div className="bosted-detail-kort" style={{ marginBottom: '1.25rem' }}>
        <div className="bosted-detail-kort-header">
          <ShieldAlert size={15} />
          <span className="bosted-detail-kort-titel">Fundsoversigt fra rapporten</span>
        </div>
        <div className="bosted-detail-kort-body">
          <div className="bosted-detail-mangler-boks">
            <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem', color: 'var(--color-primary)' }} />
            <span>
              Rapportdetaljer er endnu ikke hentet. Kør detail-scraperen via{' '}
              <code style={{ fontSize: '0.75rem', background: 'var(--color-border)', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>
                POST /api/scrapers/stps/detaljer
              </code>{' '}
              for at berige alle rapporter med vurdering, fund og baggrundsoplysninger.
            </span>
          </div>
        </div>
      </div>
    );
  }

  const harVurdering = !!bosted.pdfVurdering;
  const harFund = !!bosted.pdfFund;

  if (!harVurdering && !harFund) {
    return (
      <div className="bosted-detail-kort" style={{ marginBottom: '1.25rem' }}>
        <div className="bosted-detail-kort-header">
          <ShieldAlert size={15} />
          <span className="bosted-detail-kort-titel">Fundsoversigt fra rapporten</span>
        </div>
        <div className="bosted-detail-kort-body">
          <div className="bosted-detail-mangler-boks">
            <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem', color: 'var(--color-primary)' }} />
            <span>Indhold kunne ikke udtrækkes automatisk fra PDF. Åbn PDF direkte for at se fund og vurdering.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bosted-detail-kort" style={{ marginBottom: '1.25rem' }}>
      <div className="bosted-detail-kort-header">
        <ShieldAlert size={15} />
        <span className="bosted-detail-kort-titel">Fundsoversigt fra rapporten</span>
      </div>

      <div className="bosted-detail-kort-body">
        {harVurdering && (
          <div className="bosted-detail-field">
            <span className="bosted-detail-field-label">Samlet vurdering</span>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-primary)',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              margin: 0,
            }}>
              {bosted.pdfVurdering}
            </p>
          </div>
        )}

        {harFund && (
          <div className="bosted-detail-field" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '0.875rem' }}>
            <span className="bosted-detail-field-label">Fund ved tilsynet</span>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              margin: 0,
            }}>
              {bosted.pdfFund}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
