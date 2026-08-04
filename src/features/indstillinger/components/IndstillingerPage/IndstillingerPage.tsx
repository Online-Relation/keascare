'use client';
// src/features/indstillinger/components/IndstillingerPage/IndstillingerPage.tsx

import { useTransition } from 'react';
import { Settings, Building2, Check, Users } from 'lucide-react';
import { setVisFilter, setLosFilter } from '@/app/actions/filterActions';
import type { VisFilter, LosFilter } from '@/lib/config/GlobalFilter';

type Props = {
  aktivtFilter: VisFilter;
  losFilter: LosFilter;
};

export function IndstillingerPage({ aktivtFilter, losFilter }: Props) {
  const [pendingPrivat, startPrivat] = useTransition();
  const [pendingLos, startLos] = useTransition();

  const erPrivat = aktivtFilter === 'privat';
  const losInkluderet = losFilter === 'inkluder';

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

        {/* Privat-filter */}
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
                <span className={`ind-chip ind-chip--ekskluderet ${erPrivat ? 'ind-chip--strikethrough' : ''}`}>Primærkommune</span>
                <span className={`ind-chip ind-chip--ekskluderet ${erPrivat ? 'ind-chip--strikethrough' : ''}`}>Region</span>
                <span className={`ind-chip ind-chip--ekskluderet ${erPrivat ? 'ind-chip--strikethrough' : ''}`}>Statslig enhed</span>
                <span className="ind-chip ind-chip--inkluderet">ApS / A/S</span>
                <span className="ind-chip ind-chip--inkluderet">Selvejende</span>
                <span className="ind-chip ind-chip--inkluderet">Fond / Forening</span>
              </div>
            </div>
          </div>
          <button
            className={`ind-toggle-knap ${erPrivat ? 'ind-toggle-knap--til' : ''}`}
            onClick={() => startPrivat(async () => { await setVisFilter(erPrivat ? 'alle' : 'privat'); })}
            disabled={pendingPrivat}
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

        {/* LOS-filter */}
        <div className={`ind-toggle-kort ${losInkluderet ? 'ind-toggle-kort--aktiv' : ''}`} style={{ marginTop: '0.875rem' }}>
          <div className="ind-toggle-venstre">
            <Users size={18} className="ind-toggle-ikon" />
            <div>
              <p className="ind-toggle-label">Inkluder LOS-medlemmer i markedsdata</p>
              <p className="ind-toggle-beskrivelse">
                LOS-medlemmer (Landsorganisationen for sociale tilbud) har typisk eget tilsynssystem og er ikke primære leads.
                Som standard er de fratrukket markedstallet. Slå til for at inkludere dem i alle tal.
              </p>
              <div className="ind-driftsform-chips">
                <span className={`ind-chip ${losInkluderet ? 'ind-chip--inkluderet' : 'ind-chip--ekskluderet ind-chip--strikethrough'}`}>
                  LOS-medlemmer
                </span>
              </div>
            </div>
          </div>
          <button
            className={`ind-toggle-knap ${losInkluderet ? 'ind-toggle-knap--til' : ''}`}
            onClick={() => startLos(async () => { await setLosFilter(losInkluderet ? 'ekskluder' : 'inkluder'); })}
            disabled={pendingLos}
            role="switch"
            aria-checked={losInkluderet}
          >
            <span className="ind-toggle-knap-cirkel">
              {losInkluderet && <Check size={10} strokeWidth={3} />}
            </span>
          </button>
        </div>

        {losInkluderet && (
          <p className="ind-aktiv-note">
            LOS-medlemmer er inkluderet. Markedstallet på Markedsdata-siden viser alle tilbud inkl. LOS.
          </p>
        )}
      </div>
    </div>
  );
}
