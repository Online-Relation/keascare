// src/features/nova/components/NovaPage/sections/NovaArbejdslog.tsx

import type { NatsrapportRad } from '@/app/dashboard/nova/page';

function formatDato(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function bygOpsummering(r: NatsrapportRad): string {
  const dele: string[] = [];
  if (r.cvr_beriget    && r.cvr_beriget    > 0) dele.push(`${r.cvr_beriget} CVR-matches`);
  if (r.tp_beriget     && r.tp_beriget     > 0) dele.push(`${r.tp_beriget} TP-matches`);
  if (r.tp_requeued    && r.tp_requeued    > 0) dele.push(`${r.tp_requeued} TP-profiler sendt til opdatering`);
  if (r.los_matchet    && r.los_matchet    > 0) dele.push(`${r.los_matchet} LOS-opdateringer`);
  if (r.monday_matchet && r.monday_matchet > 0) dele.push(`${r.monday_matchet} Monday-synkroniseringer`);

  if (dele.length === 0) return 'Ingen nye matches — data er allerede opdateret.';
  return dele.join(' · ');
}

function totalHandlinger(r: NatsrapportRad): number {
  return (r.cvr_beriget ?? 0) + (r.tp_beriget ?? 0) + (r.tp_requeued ?? 0)
    + (r.los_matchet ?? 0) + (r.monday_matchet ?? 0);
}

export function NovaArbejdslog({ natsrapporter }: { natsrapporter: NatsrapportRad[] }) {
  if (natsrapporter.length === 0) {
    return (
      <section>
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: '0 0 0.5rem' }}>Arbejdslog</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Ingen kørseldata endnu — loggen udfyldes efter næste daglige cron-kørsel.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '1.5rem',
      }}>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: '0 0 1rem' }}>
          Arbejdslog — seneste {natsrapporter.length} kørsler
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {natsrapporter.map((r, i) => {
            const total = totalHandlinger(r);
            const harFejl = (r.total_fejl ?? 0) > 0;
            return (
              <div
                key={r.udfort_dato + i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr auto',
                  gap: '0.75rem',
                  alignItems: 'center',
                  padding: '0.65rem 0',
                  borderBottom: i < natsrapporter.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {formatDato(r.udfort_dato)}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {bygOpsummering(r)}
                  {harFejl && (
                    <span style={{ color: 'var(--color-accent)', marginLeft: '0.5rem' }}>
                      · {r.total_fejl} fejl
                    </span>
                  )}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: total > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {total > 0 ? `+${total} handlinger` : 'Ingen ændringer'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
