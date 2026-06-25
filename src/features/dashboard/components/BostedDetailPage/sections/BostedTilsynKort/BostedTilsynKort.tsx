// src/features/dashboard/components/BostedDetailPage/sections/BostedTilsynKort/BostedTilsynKort.tsx

import { ClipboardList, ExternalLink, FileText } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';

type BostedTilsynKortProps = {
  bosted: BostedDetail;
};

export function BostedTilsynKort({ bosted }: BostedTilsynKortProps) {
  const dato = bosted.rapportDato
    ? new Date(bosted.rapportDato).toLocaleDateString('da-DK', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  const harFokus = bosted.fokusOmraader.length > 0;
  const harTemaer = bosted.temaer.length > 0;

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <ClipboardList size={15} />
        <span className="bosted-detail-kort-titel">STPS Tilsynsrapport</span>
      </div>

      <div className="bosted-detail-kort-body">
        <div className="bosted-detail-field">
          <span className="bosted-detail-field-label">Rapportdato</span>
          <span className="bosted-detail-field-value">{dato}</span>
        </div>

        <div className="bosted-detail-field">
          <span className="bosted-detail-field-label">Tilsynsform</span>
          <span className="bosted-detail-field-value">{bosted.tilsynsform ?? '—'}</span>
        </div>

        {bosted.stpsKonklusion && (
          <div className="bosted-detail-field">
            <span className="bosted-detail-field-label">Konklusion / sanktioner</span>
            <span className="bosted-detail-field-value">{bosted.stpsKonklusion}</span>
          </div>
        )}

        {harTemaer && (
          <div className="bosted-detail-field">
            <span className="bosted-detail-field-label">Temaer</span>
            <div className="bosted-detail-tags" style={{ marginTop: '0.25rem' }}>
              {bosted.temaer.map((tema) => (
                <span key={tema} className="bosted-detail-tag">{tema}</span>
              ))}
            </div>
          </div>
        )}

        {harFokus && (
          <div className="bosted-detail-field">
            <span className="bosted-detail-field-label">Fokusområder</span>
            <div className="bosted-detail-tags" style={{ marginTop: '0.25rem' }}>
              {bosted.fokusOmraader.map((f) => (
                <span key={f} className="bosted-detail-tag" style={{ backgroundColor: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-light)' }}>
          <a
            href={bosted.rapportUrl}
            className="btn btn-outline btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={13} />
            Åbn rapport på STPS
          </a>
          {bosted.pdfUrl && (
            <a
              href={bosted.pdfUrl}
              className="btn btn-outline btn-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText size={13} />
              Åbn PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
