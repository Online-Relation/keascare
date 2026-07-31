'use client';

// src/features/auth/components/RettighederPanel/RettighederPanel.tsx

import { useEffect, useState } from 'react';
import { ShieldCheck, Save } from 'lucide-react';
import { MENU_PUNKTER, type BrugerRolle } from '@/features/auth/config/roller.config';

const ROLLER: { rolle: BrugerRolle; label: string }[] = [
  { rolle: 'direktør',         label: 'Direktør' },
  { rolle: 'bostedsansvarlig', label: 'Bostedsansvarlig' },
  { rolle: 'sygeplejerske',    label: 'Sygeplejerske' },
];

type Rettigheder = Record<string, string[]>; // rolle → stier[]

export function RettighederPanel() {
  const [rettigheder, setRettigheder] = useState<Rettigheder>({});
  const [loader, setLoader] = useState(true);
  const [gemmer, setGemmer] = useState(false);
  const [besked, setBesked] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/rolle-rettigheder')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          const map: Rettigheder = {};
          for (const row of data.rettigheder) map[row.rolle] = row.stier;
          setRettigheder(map);
        }
        setLoader(false);
      });
  }, []);

  function harRet(rolle: string, href: string): boolean {
    return (rettigheder[rolle] ?? []).includes(href);
  }

  function toggl(rolle: string, href: string) {
    setRettigheder((prev) => {
      const nuværende = prev[rolle] ?? [];
      const nye = nuværende.includes(href)
        ? nuværende.filter((s) => s !== href)
        : [...nuværende, href];
      return { ...prev, [rolle]: nye };
    });
  }

  async function gem() {
    setGemmer(true);
    setBesked(null);
    const fejl: string[] = [];

    for (const { rolle } of ROLLER) {
      const res = await fetch('/api/admin/rolle-rettigheder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolle, stier: rettigheder[rolle] ?? [] }),
      });
      const data = await res.json();
      if (!data.ok) fejl.push(`${rolle}: ${data.fejl}`);
    }

    setBesked(fejl.length === 0 ? 'Rettigheder gemt.' : fejl.join(' · '));
    setGemmer(false);
  }

  const grupper = Array.from(new Set(MENU_PUNKTER.map((p) => p.gruppe)));

  if (loader) return <p style={{ padding: '1rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Henter rettigheder…</p>;

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <ShieldCheck size={15} />
        <span className="bosted-detail-kort-titel">Rollerettigheder</span>
        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Development har altid adgang til alt
        </span>
      </div>

      <div className="bosted-detail-kort-body" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>
                Menupunkt
              </th>
              {ROLLER.map(({ rolle, label }) => (
                <th key={rolle} style={{ textAlign: 'center', padding: '0.4rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupper.map((gruppe) => {
              const punkter = MENU_PUNKTER.filter((p) => p.gruppe === gruppe);
              return [
                <tr key={`gruppe-${gruppe}`}>
                  <td colSpan={ROLLER.length + 1} style={{ padding: '0.6rem 0.5rem 0.2rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                    {gruppe}
                  </td>
                </tr>,
                ...punkter.map((punkt) => (
                  <tr key={punkt.href} style={{ borderBottom: '1px solid var(--color-border-subtle, var(--color-border))' }}>
                    <td style={{ padding: '0.45rem 0.5rem', color: 'var(--color-text-primary)' }}>
                      {punkt.label}
                    </td>
                    {ROLLER.map(({ rolle }) => (
                      <td key={rolle} style={{ textAlign: 'center', padding: '0.45rem 0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={harRet(rolle, punkt.href)}
                          onChange={() => toggl(rolle, punkt.href)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                      </td>
                    ))}
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={gem} disabled={gemmer} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Save size={14} />
            {gemmer ? 'Gemmer…' : 'Gem rettigheder'}
          </button>
          {besked && (
            <span style={{ fontSize: 'var(--text-xs)', color: besked === 'Rettigheder gemt.' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {besked}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
