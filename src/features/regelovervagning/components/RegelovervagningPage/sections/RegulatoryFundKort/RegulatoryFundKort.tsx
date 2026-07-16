'use client';

import { ExternalLink } from 'lucide-react';
import type { RegulatoryItem, ReviewStatus } from '@/features/regelovervagning/types/regulatory.types';

type Props = {
  item: RegulatoryItem;
  onStatusSkift: (id: string, status: ReviewStatus) => void;
};

const RELEVANS_KLASSE: Record<string, string> = {
  høj:    'badge-danger',
  middel: 'badge-warning',
  lav:    'badge-info',
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  ny:             'Ny',
  læst:           'Læst',
  relevant:       'Relevant',
  ikke_relevant:  'Ikke relevant',
  handling:       'Kræver handling',
};

export function RegulatoryFundKort({ item, onStatusSkift }: Props) {
  const dato = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('da-DK')
    : null;

  return (
    <div className="regulatory-kort">
      <div className="regulatory-kort-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className={`badge ${RELEVANS_KLASSE[item.relevanceLevel] ?? 'badge-info'}`}>
            {item.relevanceLevel === 'høj' ? 'Høj relevans' : item.relevanceLevel === 'middel' ? 'Middel relevans' : 'Lav relevans'}
          </span>
          {item.sourceType && (
            <span className="badge badge-neutral">{item.sourceType}</span>
          )}
          {item.topics.slice(0, 2).map((t) => (
            <span key={t} className="badge badge-topic">{t}</span>
          ))}
        </div>
        {dato && <span className="regulatory-dato">{dato}</span>}
      </div>

      <p className="regulatory-titel">{item.title}</p>

      {item.summary && (
        <p className="regulatory-summary">{item.summary}</p>
      )}

      {item.recommendedAction && item.relevanceLevel !== 'lav' && (
        <p className="regulatory-anbefaling">
          <strong>Intern anbefaling:</strong> {item.recommendedAction}
        </p>
      )}

      <div className="regulatory-kort-footer">
        <select
          className="regulatory-status-vælger"
          value={item.reviewStatus}
          onChange={(e) => onStatusSkift(item.id, e.target.value as ReviewStatus)}
        >
          {(Object.entries(STATUS_LABELS) as [ReviewStatus, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            title="Åbn original kilde"
          >
            <ExternalLink size={13} /> Åbn kilde
          </a>
        )}
      </div>
    </div>
  );
}
