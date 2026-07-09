'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { MondayKundeItem } from '@/features/monday/types/monday.types';

type Props = { kunder: MondayKundeItem[] };

const MONDAY_BOARD_URL = 'https://onlinerelation.monday.com/boards';

function beregnLevetidMåneder(oprettet: string | null, afsluttet: string | null): number | null {
  if (!oprettet || !afsluttet) return null;
  const fra = new Date(oprettet);
  const til = new Date(afsluttet);
  if (isNaN(fra.getTime()) || isNaN(til.getTime())) return null;
  const måneder = (til.getFullYear() - fra.getFullYear()) * 12 + (til.getMonth() - fra.getMonth());
  return Math.max(0, måneder);
}

function formaterLevetid(måneder: number | null): string {
  if (måneder === null) return '—';
  if (måneder < 12) return `${måneder} mdr.`;
  const år = Math.floor(måneder / 12);
  const rest = måneder % 12;
  return rest > 0 ? `${år} år ${rest} mdr.` : `${år} år`;
}

export function AfsluttedeKunderTabel({ kunder }: Props) {
  const afsluttede = kunder
    .filter((k) => k.gruppe === 'afsluttet_forloeb')
    .sort((a, b) => {
      if (!a.afsluttetDato && !b.afsluttetDato) return 0;
      if (!a.afsluttetDato) return 1;
      if (!b.afsluttetDato) return -1;
      return new Date(b.afsluttetDato).getTime() - new Date(a.afsluttetDato).getTime();
    });

  if (afsluttede.length === 0) return null;

  const levetider = afsluttede
    .map((k) => beregnLevetidMåneder(k.oprettetDato, k.afsluttetDato))
    .filter((m): m is number => m !== null);

  const gennemsnit = levetider.length > 0
    ? Math.round(levetider.reduce((a, b) => a + b, 0) / levetider.length)
    : null;

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <span className="bosted-detail-kort-titel">Afsluttede kunder ({afsluttede.length})</span>
        {gennemsnit !== null && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Gns. kundelevetid: <strong style={{ color: 'var(--color-text)' }}>{formaterLevetid(gennemsnit)}</strong>
          </span>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="kunder-tabel">
          <thead>
            <tr>
              <th>Bosted</th>
              <th>Forløbsansvarlig</th>
              <th>Oprettet</th>
              <th>Sidst opdateret</th>
              <th>Levetid (ca.)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {afsluttede.map((k) => {
              const levetid = beregnLevetidMåneder(k.oprettetDato, k.afsluttetDato);
              return (
                <tr key={k.mondayId}>
                  <td className="kunder-tabel-navn">
                    <span style={{ color: 'var(--color-text-muted)' }}>{k.navn}</span>
                  </td>
                  <td className="kunder-tabel-muted">{k.forløbsansvarlig ?? '—'}</td>
                  <td className="kunder-tabel-muted">
                    {k.oprettetDato ? new Date(k.oprettetDato).toLocaleDateString('da-DK') : '—'}
                  </td>
                  <td className="kunder-tabel-muted">
                    {k.afsluttetDato ? new Date(k.afsluttetDato).toLocaleDateString('da-DK') : '—'}
                  </td>
                  <td className="kunder-tabel-muted">{formaterLevetid(levetid)}</td>
                  <td>
                    <a
                      href={`${MONDAY_BOARD_URL}/${process.env.NEXT_PUBLIC_MONDAY_BOARD_ID}/pulses/${k.mondayId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      title="Åbn i Monday"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
