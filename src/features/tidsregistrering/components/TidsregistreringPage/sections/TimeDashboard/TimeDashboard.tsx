'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/TimeDashboard.tsx

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import {
  hentRegistreringerIPeriode, sletRegistrering,
  hentAktivitetsKalenderData, hentUgentligKategoriData, hentAlleKategorier,
} from '@/features/tidsregistrering/services/TidsregistreringService';
import {
  getPeriodeDatoer, beregnFordeling, beregnDagligData, beregnTopOpgaver, beregnArbejdsdage,
} from '@/features/tidsregistrering/utils/DashboardUtils';
import type { Periode, DashboardData, Tidsregistrering, TidsregistreringKategori } from '@/features/tidsregistrering/types/tidsregistrering.types';
import { TimePeriodeVælger } from './TimePeriodeVælger';
import { TimeMetricGrid } from './TimeMetricGrid';
import { TimeFordelingChart } from './TimeFordelingChart';
import { TimeUdviklingChart } from './TimeUdviklingChart';
import { TopOpgaverListe } from './TopOpgaverListe';
import { SenesteRegistreringer } from './SenesteRegistreringer';
import { TimeAktivitetsKalender } from './TimeAktivitetsKalender';
import { KapacitetOverview } from './KapacitetOverview';
import { UgentligKategoriGennemsnit } from './UgentligKategoriGennemsnit';
import { FokusfordelingCard } from './FokusfordeligCard';
import { AfvigelserCard } from './AfvigelserCard';
import { InternEksternCard } from './InternEksternCard';
import { FakturerbarCard } from './FakturerbarCard';
import { MaalKort } from './MaalKort';

type Props = { onSeAlle: () => void };

const TOM_DATA: DashboardData = {
  totalMinutter: 0, antalRegistreringer: 0, antalArbejdsdage: 0,
  gennemsnitPrDagMin: 0, forrigeTotal: 0,
  fordeling: [], dagligData: [], topOpgaver: [], seneste: [],
};

export function TimeDashboard({ onSeAlle }: Props) {
  const [periode, setPeriode]     = useState<Periode>('denne-uge');
  const [data, setData]           = useState<DashboardData>(TOM_DATA);
  const [indlæser, setIndlæser]   = useState(true);
  const [fejl, setFejl]           = useState<string | null>(null);
  const [kalData, setKalData]         = useState<{ dato: string; minutter: number }[]>([]);
  const [ugeData, setUgeData]         = useState<Tidsregistrering[]>([]);
  const [forrigeRegs, setForrigeRegs] = useState<Tidsregistrering[]>([]);
  const [kategorier, setKategorier]   = useState<TidsregistreringKategori[]>([]);

  const load = useCallback(async (p: Periode) => {
    setIndlæser(true);
    setFejl(null);
    try {
      const { fra, til, forrigeFra, forrigeTil } = getPeriodeDatoer(p);
      const [aktuelle, forrige] = await Promise.all([
        hentRegistreringerIPeriode(fra, til),
        hentRegistreringerIPeriode(forrigeFra, forrigeTil),
      ]);
      const totalMinutter    = aktuelle.reduce((s, r) => s + (r.varighedMinutter ?? 0), 0);
      const forrigeTotal     = forrige.reduce((s, r) => s + (r.varighedMinutter ?? 0), 0);
      const antalArbejdsdage = beregnArbejdsdage(fra, til);
      setData({
        totalMinutter, antalRegistreringer: aktuelle.length, antalArbejdsdage,
        gennemsnitPrDagMin: antalArbejdsdage > 0 ? Math.round(totalMinutter / antalArbejdsdage) : 0,
        forrigeTotal,
        fordeling:  beregnFordeling(aktuelle),
        dagligData: beregnDagligData(aktuelle, fra, til, p),
        topOpgaver: beregnTopOpgaver(aktuelle, 5),
        seneste:    aktuelle,
      });
      setForrigeRegs(forrige);
    } catch {
      setFejl('Kunne ikke hente data. Prøv igen.');
    } finally {
      setIndlæser(false);
    }
  }, []);

  // Hent heatmap, ugentlige data og kategorier én gang ved mount
  useEffect(() => {
    Promise.all([hentAktivitetsKalenderData(182), hentUgentligKategoriData(8), hentAlleKategorier()])
      .then(([kal, uge, kats]) => { setKalData(kal); setUgeData(uge); setKategorier(kats); })
      .catch(() => {});
  }, []);

  useEffect(() => { load(periode); }, [periode, load]);

  async function håndterSlet(id: string) {
    await sletRegistrering(id);
    setData((prev) => {
      const næste = prev.seneste.filter((r) => r.id !== id);
      const totalMinutter = næste.reduce((s, r) => s + (r.varighedMinutter ?? 0), 0);
      return {
        ...prev, totalMinutter,
        antalRegistreringer: næste.length,
        gennemsnitPrDagMin: prev.antalArbejdsdage > 0 ? Math.round(totalMinutter / prev.antalArbejdsdage) : 0,
        fordeling:  beregnFordeling(næste),
        topOpgaver: beregnTopOpgaver(næste, 5),
        seneste:    næste,
      };
    });
  }

  const { label } = getPeriodeDatoer(periode);

  return (
    <div className="tr-dash">
      <div className="tr-dash-topbar">
        <div className="tr-dash-topbar-venstre">
          <h1 className="tr-page-titel">Tidsregistrering</h1>
          <p className="tr-dash-undertekst">Få overblik over din tid og dine opgaver</p>
        </div>
        <div className="tr-dash-topbar-højre">
          <TimePeriodeVælger periode={periode} periodeLabel={label} onChange={setPeriode} />
          <button className="tr-dash-ny-knap" onClick={onSeAlle}>
            <Plus size={15} /> Ny registrering
          </button>
        </div>
      </div>

      {fejl && <div className="tr-slet-fejl" role="alert">{fejl}</div>}

      {indlæser ? (
        <div className="tr-dash-skeleton-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="tr-dash-skeleton-kort" />)}
        </div>
      ) : (
        <>
          <TimeMetricGrid data={data} periode={periode} />

          <div className="tr-dash-grid-2">
            <TimeFordelingChart fordeling={data.fordeling} totalMinutter={data.totalMinutter} />
            <TimeUdviklingChart dagligData={data.dagligData} />
          </div>

          <TimeAktivitetsKalender data={kalData} />

          <div className="tr-dash-grid-3">
            <TopOpgaverListe topOpgaver={data.topOpgaver} />
            <UgentligKategoriGennemsnit registreringer={ugeData} antalUger={8} />
            <KapacitetOverview totalMinutter={data.totalMinutter} antalArbejdsdage={data.antalArbejdsdage} periode={periode} />
          </div>

          <div className="tr-dash-grid-2">
            <FokusfordelingCard aktuelle={data.seneste} forrige={forrigeRegs} />
            <AfvigelserCard aktuelle={data.seneste} historiske={ugeData} />
          </div>

          <div className="tr-dash-grid-3">
            <InternEksternCard registreringer={data.seneste} kategorier={kategorier} />
            <FakturerbarCard registreringer={data.seneste} kategorier={kategorier} />
            <MaalKort registreringer={data.seneste} kategorier={kategorier} />
          </div>

          <SenesteRegistreringer
            registreringer={data.seneste}
            onSlet={håndterSlet}
            onSeAlle={onSeAlle}
          />
        </>
      )}
    </div>
  );
}
