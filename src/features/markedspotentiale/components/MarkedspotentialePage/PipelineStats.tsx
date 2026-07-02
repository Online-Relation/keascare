'use client';

import { useEffect, useState } from 'react';
import { Phone, XCircle, Clock, TrendingUp } from 'lucide-react';

type Stats = {
  kontaktet: number;
  afvist: number;
  kontaktSenere: number;
  total: number;
};

export function PipelineStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/markedspotentiale/pipeline-stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const konvPct = stats.kontaktet > 0
    ? ((stats.kontaktet / Math.max(stats.total, 1)) * 100).toFixed(0)
    : '0';

  const items = [
    { label: 'Kontaktede', value: stats.kontaktet, icon: <Phone size={14} />, color: '#1d4ed8' },
    { label: 'Afviste', value: stats.afvist, icon: <XCircle size={14} />, color: '#dc2626' },
    { label: 'Kontakt senere', value: stats.kontaktSenere, icon: <Clock size={14} />, color: '#d97706' },
    { label: 'Kontaktrate', value: `${konvPct}%`, icon: <TrendingUp size={14} />, color: '#15803d' },
  ];

  return (
    <div className="mp-pipeline-wrapper">
      <h2 className="mf-chart-titel" style={{ marginBottom: '0.5rem' }}>Pipeline-opfølgning</h2>
      <p className="mf-chart-beskrivelse" style={{ marginBottom: '1rem' }}>
        Baseret på kontaktlog — loggede handlinger pr. bosted
      </p>
      <div className="mp-pipeline-grid">
        {items.map((item) => (
          <div key={item.label} className="mp-pipeline-kort">
            <div className="mp-pipeline-ikon" style={{ color: item.color }}>{item.icon}</div>
            <div className="mp-pipeline-tal" style={{ color: item.color }}>{item.value}</div>
            <div className="mp-pipeline-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
