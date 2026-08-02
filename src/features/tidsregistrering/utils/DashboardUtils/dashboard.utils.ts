// src/features/tidsregistrering/utils/DashboardUtils/dashboard.utils.ts

import type { Tidsregistrering, Periode, KategoriFordeling, DagligData, TopOpgave } from '@/features/tidsregistrering/types/tidsregistrering.types';

export const KATEGORI_FARVER = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#64748b', '#0891b2', '#be185d'];

function getMandagDato(d: Date): Date {
  const dag = d.getDay();
  const diff = dag === 0 ? -6 : 1 - dag;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

export function getPeriodeDatoer(periode: Periode): {
  fra: Date; til: Date; forrigeFra: Date; forrigeTil: Date; label: string;
} {
  const nu = new Date();
  let fra: Date, til: Date, forrigeFra: Date, forrigeTil: Date, label: string;

  switch (periode) {
    case 'denne-uge': {
      fra = getMandagDato(nu);
      til = new Date(fra); til.setDate(fra.getDate() + 6); til.setHours(23, 59, 59, 999);
      forrigeFra = new Date(fra); forrigeFra.setDate(fra.getDate() - 7);
      forrigeTil = new Date(fra); forrigeTil.setDate(fra.getDate() - 1); forrigeTil.setHours(23, 59, 59, 999);
      label = `${fra.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} – ${til.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      break;
    }
    case 'sidste-uge': {
      const mandag = getMandagDato(nu);
      til = new Date(mandag); til.setDate(mandag.getDate() - 1); til.setHours(23, 59, 59, 999);
      fra = new Date(mandag); fra.setDate(mandag.getDate() - 7); fra.setHours(0, 0, 0, 0);
      forrigeFra = new Date(fra); forrigeFra.setDate(fra.getDate() - 7);
      forrigeTil = new Date(fra); forrigeTil.setDate(fra.getDate() - 1); forrigeTil.setHours(23, 59, 59, 999);
      label = `${fra.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} – ${til.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      break;
    }
    case 'denne-maaned': {
      fra = new Date(nu.getFullYear(), nu.getMonth(), 1);
      til = new Date(nu.getFullYear(), nu.getMonth() + 1, 0, 23, 59, 59, 999);
      forrigeFra = new Date(nu.getFullYear(), nu.getMonth() - 1, 1);
      forrigeTil = new Date(nu.getFullYear(), nu.getMonth(), 0, 23, 59, 59, 999);
      label = fra.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
      break;
    }
    case 'sidste-maaned': {
      fra = new Date(nu.getFullYear(), nu.getMonth() - 1, 1);
      til = new Date(nu.getFullYear(), nu.getMonth(), 0, 23, 59, 59, 999);
      forrigeFra = new Date(nu.getFullYear(), nu.getMonth() - 2, 1);
      forrigeTil = new Date(nu.getFullYear(), nu.getMonth() - 1, 0, 23, 59, 59, 999);
      label = fra.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
      break;
    }
    case 'dette-aar': {
      fra = new Date(nu.getFullYear(), 0, 1);
      til = new Date(nu.getFullYear(), 11, 31, 23, 59, 59, 999);
      forrigeFra = new Date(nu.getFullYear() - 1, 0, 1);
      forrigeTil = new Date(nu.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      label = String(nu.getFullYear());
      break;
    }
  }

  return { fra, til, forrigeFra, forrigeTil, label };
}

export function beregnFordeling(registreringer: Tidsregistrering[]): KategoriFordeling[] {
  const map = new Map<string, { navn: string; minutter: number }>();
  for (const r of registreringer) {
    const e = map.get(r.kategoriId) ?? { navn: r.kategoriNavn, minutter: 0 };
    e.minutter += r.varighedMinutter ?? 0;
    map.set(r.kategoriId, e);
  }
  const total = [...map.values()].reduce((s, v) => s + v.minutter, 0);
  return [...map.entries()]
    .sort((a, b) => b[1].minutter - a[1].minutter)
    .map(([id, { navn, minutter }], i) => ({
      kategoriId: id, kategoriNavn: navn, minutter,
      procentAndel: total > 0 ? Math.round((minutter / total) * 100) : 0,
      farve: KATEGORI_FARVER[i % KATEGORI_FARVER.length],
    }));
}

export function beregnDagligData(registreringer: Tidsregistrering[], fra: Date, til: Date, periode: Periode): DagligData[] {
  const DAGE = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
  const map = new Map<string, { minutter: number; antal: number }>();
  const cur = new Date(fra);
  while (cur <= til) {
    map.set(cur.toISOString().slice(0, 10), { minutter: 0, antal: 0 });
    cur.setDate(cur.getDate() + 1);
  }
  for (const r of registreringer) {
    const key = r.startTid.slice(0, 10);
    const e = map.get(key) ?? { minutter: 0, antal: 0 };
    e.minutter += r.varighedMinutter ?? 0;
    e.antal += 1;
    map.set(key, e);
  }
  const erUge = periode === 'denne-uge' || periode === 'sidste-uge';
  return [...map.entries()].map(([dato, { minutter, antal }]) => ({
    dato,
    label: erUge ? DAGE[new Date(dato).getDay()] : new Date(dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }),
    minutter,
    antalRegistreringer: antal,
  }));
}

export function beregnTopOpgaver(registreringer: Tidsregistrering[], limit = 5): TopOpgave[] {
  const map = new Map<string, { kategoriNavn: string; minutter: number }>();
  for (const r of registreringer) {
    const key = r.underpunktNavn ?? r.kategoriNavn;
    const e = map.get(key) ?? { kategoriNavn: r.kategoriNavn, minutter: 0 };
    e.minutter += r.varighedMinutter ?? 0;
    map.set(key, e);
  }
  const total = [...map.values()].reduce((s, v) => s + v.minutter, 0);
  return [...map.entries()]
    .sort((a, b) => b[1].minutter - a[1].minutter)
    .slice(0, limit)
    .map(([navn, { kategoriNavn, minutter }]) => ({
      navn, kategoriNavn, minutter,
      procentAndel: total > 0 ? Math.round((minutter / total) * 100) : 0,
    }));
}

export function beregnArbejdsdage(fra: Date, til: Date): number {
  let count = 0;
  const d = new Date(fra);
  const slutDato = new Date(Math.min(til.getTime(), new Date().getTime()));
  while (d <= slutDato) {
    const dag = d.getDay();
    if (dag !== 0 && dag !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function formatMinKort(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}t ${m}m`;
  if (h > 0) return `${h}t`;
  return `${m}m`;
}
