// src/features/scrapers/components/ScrapersPage/ScraperFremgang/ScraperFremgang.tsx

'use client';

import { useEffect, useState } from 'react';
import type { FremgangItem } from '@/app/api/scrapers/fremgang/route';

function farveklasse(pct: number): string {
  if (pct >= 95) return 'fremgang-bar--grøn';
  if (pct >= 60) return 'fremgang-bar--blå';
  if (pct >= 30) return 'fremgang-bar--gul';
  return 'fremgang-bar--rød';
}

function statusLabel(pct: number): string {
  if (pct >= 95) return 'Næsten i mål';
  if (pct >= 60) return 'God fremgang';
  if (pct >= 30) return 'I gang';
  return 'Ikke startet';
}

type Props = { item: FremgangItem };

function FremgangKort({ item }: Props) {
  const cls = farveklasse(item.pct);
  const mangler = item.mål - item.nuværende;

  return (
    <div className="fremgang-kort">
      <div className="fremgang-kort-top">
        <div>
          <p className="fremgang-label">{item.label}</p>
          <p className="fremgang-beskrivelse">{item.beskrivelse}</p>
        </div>
        <div className="fremgang-pct-wrap">
          <span className={`fremgang-pct ${cls.replace('fremgang-bar--', 'fremgang-pct--')}`}>
            {item.pct}%
          </span>
        </div>
      </div>

      <div className="fremgang-bar-wrap">
        <div className={`fremgang-bar ${cls}`} style={{ width: `${item.pct}%` }} />
      </div>

      <div className="fremgang-tal-række">
        <span className="fremgang-tal-aktuel">
          {item.nuværende.toLocaleString('da-DK')} af {item.mål.toLocaleString('da-DK')}
        </span>
        <span className={`fremgang-status-badge ${cls.replace('fremgang-bar--', 'fremgang-badge--')}`}>
          {mangler > 0 ? `${mangler.toLocaleString('da-DK')} mangler` : statusLabel(item.pct)}
        </span>
      </div>
    </div>
  );
}

export function ScraperFremgang() {
  const [total, setTotal] = useState<number>(0);
  const [items, setItems] = useState<FremgangItem[]>([]);
  const [indlæser, setIndlæser] = useState(true);

  useEffect(() => {
    fetch('/api/scrapers/fremgang')
      .then((r) => r.json())
      .then((data: { total: number; items: FremgangItem[] }) => {
        setTotal(data.total);
        setItems(data.items);
      })
      .catch(() => {})
      .finally(() => setIndlæser(false));
  }, []);

  if (indlæser) return null;
  if (items.length === 0) return null;

  const samletPct = items.length > 0
    ? Math.round(items.reduce((s, i) => s + i.pct, 0) / items.length)
    : 0;

  return (
    <section className="scraper-fremgang-sektion">
      <div className="scraper-fremgang-header">
        <div>
          <h2 className="scraper-historik-titel">Fremgang mod mål</h2>
          <p className="scraper-historik-sub">
            {total.toLocaleString('da-DK')} bosteder i databasen — her er berigningsstatus
          </p>
        </div>
        <div className="fremgang-samlet">
          <span className="fremgang-samlet-tal">{samletPct}%</span>
          <span className="fremgang-samlet-label">samlet berigningsgrad</span>
        </div>
      </div>

      <div className="fremgang-grid">
        {items.map((item) => (
          <FremgangKort key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
