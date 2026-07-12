import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';

type Props = { bosted: BostedDetail };

function formaterKr(beloeb: number | null): string {
  if (beloeb === null) return '—';
  const abs = Math.abs(beloeb);
  if (abs >= 1_000_000) return `${(beloeb / 1_000_000).toFixed(1).replace('.', ',')} mio. kr.`;
  if (abs >= 1_000) return `${(beloeb / 1_000).toFixed(0)} t. kr.`;
  return `${beloeb} kr.`;
}

function ResultatBadge({ beloeb }: { beloeb: number | null }) {
  if (beloeb === null) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  const farve = beloeb >= 0 ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)';
  return <span style={{ color: farve, fontWeight: 'var(--fw-medium)' }}>{formaterKr(beloeb)}</span>;
}

export function BostedRegnskabKort({ bosted }: Props) {
  // Intet CVR — kan ikke hente regnskab
  if (!bosted.cvr) return null;

  // Aldrig forsøgt hentet eller ingen data — regnskab hentes via "Hent TP-data nu"
  if (!bosted.regnskabAar) {
    return (
      <div className="dashboard-kort" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ fontWeight: 'var(--fw-semibold)' }}>Økonomi</p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          {bosted.regnskabOpdateret
            ? 'Ingen årsregnskab fundet i Erhvervsstyrelsens register.'
            : 'Regnskab hentes automatisk via "Hent TP-data nu" under Bostedinformation.'}
        </p>
      </div>
    );
  }

  const rækker: { label: string; værdi: React.ReactNode }[] = [
    { label: 'Nettoomsætning',   værdi: formaterKr(bosted.regnskabNettoomsaetning) },
    { label: 'Bruttofortjeneste', værdi: formaterKr(bosted.regnskabBruttofortjeneste) },
    { label: 'Årsresultat',      værdi: <ResultatBadge beloeb={bosted.regnskabAarsresultat} /> },
    { label: 'Egenkapital',      værdi: formaterKr(bosted.regnskabEgenkapital) },
    { label: 'Balance',          værdi: formaterKr(bosted.regnskabBalance) },
  ].filter((r) => r.værdi !== '—');

  return (
    <div className="dashboard-kort" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
        <p style={{ fontWeight: 'var(--fw-semibold)' }}>Økonomi</p>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Årsregnskab {bosted.regnskabAar}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {rækker.map((r) => (
          <div key={r.label}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>{r.label}</p>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>{r.værdi}</p>
          </div>
        ))}
      </div>

      {bosted.regnskabOpdateret && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
          Kilde: Erhvervsstyrelsen · Hentet {new Date(bosted.regnskabOpdateret).toLocaleDateString('da-DK')}
        </p>
      )}
    </div>
  );
}
