// src/features/dashboard/components/BostedDetailPage/sections/BostedOrganisationKort/TpÆndringsvisning.tsx
// Hjælpekomponenter til visning af Tilbudsportalen-ændringshistorik

import type { TpÆndring } from '@/features/tilbudsportalen/repository/TilbudsportalenRepository';

function formatDato(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Viser de seneste ændringer for ét felt — maks 2 tidligere værdier
export function ÆndringsHistorik({ ændringer, felt }: { ændringer: TpÆndring[]; felt: string }) {
  const relevante = ændringer.filter((æ) => æ.felt === felt).slice(0, 2);
  if (relevante.length === 0) return null;

  return (
    <div style={{ marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
      {relevante.map((æ, i) => (
        <span
          key={i}
          style={{
            fontSize: '0.68rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <span style={{ opacity: 0.6 }}>↩</span>
          {æ.gammel
            ? (
              <>
                <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{æ.gammel}</span>
                <span>· ændret {formatDato(æ.opdaget)}</span>
              </>
            )
            : <span>Ikke oplyst tidligere · registreret {formatDato(æ.opdaget)}</span>
          }
        </span>
      ))}
    </div>
  );
}

// Pladser-felt med retningsindikator (▲/▼) og historik
export function PladserMedHistorik({ nuværende, ændringer }: { nuværende: string | null; ændringer: TpÆndring[] }) {
  const seneste = ændringer.find((æ) => æ.felt === 'pladser' || æ.felt === 'pladser_totalt');

  const pil = (() => {
    if (!seneste || !nuværende || !seneste.gammel) return null;
    const ny = parseInt(nuværende, 10);
    const gammel = parseInt(seneste.gammel, 10);
    if (isNaN(ny) || isNaN(gammel) || ny === gammel) return null;
    return ny > gammel ? '▲' : '▼';
  })();

  return (
    <div className="bosted-detail-field">
      <span className="bosted-detail-field-label">Pladser</span>
      <div>
        {nuværende
          ? (
            <span className="bosted-detail-field-value">
              {nuværende}
              {pil && (
                <span style={{
                  marginLeft: '0.3rem',
                  fontSize: '0.75rem',
                  color: pil === '▲' ? 'var(--color-success)' : 'var(--color-accent)',
                }}>
                  {pil}
                </span>
              )}
            </span>
          )
          : <span className="bosted-detail-placeholder">Mangler data</span>
        }
        <ÆndringsHistorik ændringer={ændringer} felt="pladser" />
      </div>
    </div>
  );
}
