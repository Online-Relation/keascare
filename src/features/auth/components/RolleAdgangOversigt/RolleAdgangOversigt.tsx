'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { MENU_PUNKTER, harDynamiskAdgang, ROLLE_LABELS, type BrugerRolle } from '@/features/auth/config/roller.config';
import { useRolleRettigheder } from '@/features/auth/components/RolleRettighederProvider';

type Props = { rolle: BrugerRolle };

export function RolleAdgangOversigt({ rolle }: Props) {
  const { rettigheder: dbRettigheder } = useRolleRettigheder();
  const grupper = Array.from(new Set(MENU_PUNKTER.map((p) => p.gruppe)));

  return (
    <div style={{ marginTop: '1rem' }}>
      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.6rem' }}>
        Adgang som {ROLLE_LABELS[rolle]}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {grupper.map((gruppe) => {
          const punkter = MENU_PUNKTER.filter((p) => p.gruppe === gruppe);
          return (
            <div key={gruppe}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                {gruppe}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {punkter.map((punkt) => {
                  const har = harDynamiskAdgang(rolle, punkt.href, dbRettigheder);
                  return (
                    <div key={punkt.href} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {har
                        ? <CheckCircle2 size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                        : <XCircle size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      }
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: har ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      }}>
                        {punkt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
