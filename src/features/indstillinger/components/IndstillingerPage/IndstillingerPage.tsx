'use client';
// src/features/indstillinger/components/IndstillingerPage/IndstillingerPage.tsx

import { useTransition } from 'react';
import { Settings, Building2, Check, Users, FileText } from 'lucide-react';
import { setVisFilter, setLosFilter, setParagraf43Filter } from '@/app/actions/filterActions';
import type { VisFilter, LosFilter, ParagrafFilter } from '@/lib/config/GlobalFilter';

type Props = {
  aktivtFilter: VisFilter;
  losFilter: LosFilter;
  paragraf43Filter: ParagrafFilter;
};

export function IndstillingerPage({ aktivtFilter, losFilter, paragraf43Filter }: Props) {
  const [pendingPrivat, startPrivat] = useTransition();
  const [pendingLos, startLos] = useTransition();
  const [pendingP43, startP43] = useTransition();

  const erPrivat = aktivtFilter === 'privat';
  const losEkskluderet = losFilter === 'ekskluder';
  const kun43 = paragraf43Filter === 'kun_43';

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
                tabeller, grafer, KPI&apos;er og søgning viser kun private og selvejende tilbud.
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
        <div className={`ind-toggle-kort ${losEkskluderet ? 'ind-toggle-kort--aktiv' : ''}`} style={{ marginTop: '0.875rem' }}>
          <div className="ind-toggle-venstre">
            <Users size={18} className="ind-toggle-ikon" />
            <div>
              <p className="ind-toggle-label">Ekskluder LOS-medlemmer fra markedsdata</p>
              <p className="ind-toggle-beskrivelse">
                LOS-medlemmer (Landsorganisationen for sociale tilbud) har typisk eget tilsynssystem og er ikke primære leads.
                Som standard er de inkluderet i markedstallet. Slå til for at fratrække dem fra alle tal.
              </p>
              <div className="ind-driftsform-chips">
                <span className={`ind-chip ${losEkskluderet ? 'ind-chip--ekskluderet ind-chip--strikethrough' : 'ind-chip--inkluderet'}`}>
                  LOS-medlemmer
                </span>
              </div>
            </div>
          </div>
          <button
            className={`ind-toggle-knap ${losEkskluderet ? 'ind-toggle-knap--til' : ''}`}
            onClick={() => startLos(async () => { await setLosFilter(losEkskluderet ? 'inkluder' : 'ekskluder'); })}
            disabled={pendingLos}
            role="switch"
            aria-checked={losEkskluderet}
          >
            <span className="ind-toggle-knap-cirkel">
              {losEkskluderet && <Check size={10} strokeWidth={3} />}
            </span>
          </button>
        </div>

        {losEkskluderet && (
          <p className="ind-aktiv-note">
            LOS-filteret er aktivt. Markedstallet på Markedsdata-siden viser kun tilbud uden LOS-medlemmer.
          </p>
        )}

        {/* §43-filter */}
        <div className={`ind-toggle-kort ${kun43 ? 'ind-toggle-kort--aktiv' : ''}`} style={{ marginTop: '0.875rem' }}>
          <div className="ind-toggle-venstre">
            <FileText size={18} className="ind-toggle-ikon" />
            <div>
              <p className="ind-toggle-label">Vis kun § 43 med en STPS-tilsynsrapport</p>
              <p className="ind-toggle-beskrivelse">
                Når slået til vises på alle sider — dashboard, markedspotentiale, rapporter og
                markedsdata — udelukkende bosteder med tilbudstype § 43 (Socialtilsynet), og kun
                dem der rent faktisk har en STPS-tilsynsrapport. Alt andet filtreres fra.
              </p>
              <div className="ind-driftsform-chips">
                <span className="ind-chip ind-chip--inkluderet">§ 43</span>
                <span className={`ind-chip ind-chip--ekskluderet ${kun43 ? 'ind-chip--strikethrough' : ''}`}>§ 107</span>
                <span className={`ind-chip ind-chip--ekskluderet ${kun43 ? 'ind-chip--strikethrough' : ''}`}>§ 108</span>
              </div>
            </div>
          </div>
          <button
            className={`ind-toggle-knap ${kun43 ? 'ind-toggle-knap--til' : ''}`}
            onClick={() => startP43(async () => { await setParagraf43Filter(kun43 ? 'alle' : 'kun_43'); })}
            disabled={pendingP43}
            role="switch"
            aria-checked={kun43}
          >
            <span className="ind-toggle-knap-cirkel">
              {kun43 && <Check size={10} strokeWidth={3} />}
            </span>
          </button>
        </div>

        {kun43 && (
          <p className="ind-aktiv-note">
            §43-filteret er aktivt. Al data på tværs af dashboardet viser kun § 43-bosteder med en ægte STPS-tilsynsrapport.
          </p>
        )}
      </div>
    </div>
  );
}
