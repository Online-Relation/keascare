'use client';
// src/features/indstillinger/components/IndstillingerPage/IndstillingerPage.tsx

import { useTransition } from 'react';
import { Settings, Building2, Check } from 'lucide-react';
import { setVisFilter } from '@/app/actions/filterActions';
import type { VisFilter } from '@/lib/config/GlobalFilter';

type Props = { aktivtFilter: VisFilter };

export function IndstillingerPage({ aktivtFilter }: Props) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setVisFilter(aktivtFilter === 'privat' ? 'alle' : 'privat');
    });
  }

  const erPrivat = aktivtFilter === 'privat';

  return (
    <div className="dashboard-content">
      <div className="ind-header">
        <Settings size={20} className="ind-header-ikon" />
        <div>
          <h1 className="ind-titel">Indstillinger</h1>
          <p className="ind-undertitel">Globale præferencer for dashboardet</p>
        </div>
      </div>

      <div className="ind-sektion">
        <h2 className="ind-sektion-titel">Datavisning</h2>

        <div className={`ind-toggle-kort ${erPrivat ? 'ind-toggle-kort--aktiv' : ''}`}>
          <div className="ind-toggle-venstre">
            <Building2 size={18} className="ind-toggle-ikon" />
            <div>
              <p className="ind-toggle-label">Vis kun private og selvejende bosteder</p>
              <p className="ind-toggle-beskrivelse">
                Når slået til filtreres kommunale og regionale bosteder fra på alle sider —
                tabeller, grafer, KPI'er og søgning viser kun private og selvejende tilbud.
              </p>
              <div className="ind-driftsform-chips">
                <span className="ind-chip ind-chip--ekskluderet">Primærkommune</span>
                <span className="ind-chip ind-chip--ekskluderet">Region</span>
                <span className="ind-chip ind-chip--ekskluderet">Statslig enhed</span>
                <span className="ind-chip ind-chip--inkluderet">ApS / A/S</span>
                <span className="ind-chip ind-chip--inkluderet">Selvejende</span>
                <span className="ind-chip ind-chip--inkluderet">Fond / Forening</span>
              </div>
            </div>
          </div>

          <button
            className={`ind-toggle-knap ${erPrivat ? 'ind-toggle-knap--til' : ''}`}
            onClick={toggle}
            disabled={pending}
            role="switch"
            aria-checked={erPrivat}
          >
            <span className="ind-toggle-knap-cirkel">
              {erPrivat && <Check size={10} strokeWidth={3} />}
            </span>
          </button>
        </div>

        {erPrivat && (
          <p className="ind-aktiv-note">
            Filteret er aktivt. Al data på tværs af dashboardet viser kun private og selvejende bosteder.
          </p>
        )}
      </div>
    </div>
  );
}
