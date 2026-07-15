// src/features/rapporter/utils/LeadVarme/leadVarme.ts

export type LeadVarmeNiveau = 'varm' | 'køler' | 'kold' | 'ukendt';

export type LeadVarmeInfo = {
  niveau: LeadVarmeNiveau;
  dage: number;
  label: string;
  beskrivelse: string;
  farve: string;
  bg: string;
  border: string;
};

// markerPct: 0 = helt grøn (ny), 100 = helt rød (gammel). Maks ved 90 dage.
export function beregnLeadVarme(rapportDato: string | null): LeadVarmeInfo & { markerPct: number } {
  if (!rapportDato) {
    return { niveau: 'ukendt', dage: -1, markerPct: 100, label: 'Ukendt', beskrivelse: 'Ingen rapportdato', farve: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' };
  }

  const dage = Math.floor((Date.now() - new Date(rapportDato).getTime()) / (1000 * 60 * 60 * 24));
  const markerPct = Math.min(100, Math.round((dage / 90) * 100));

  if (dage <= 30) {
    return { niveau: 'varm', dage, markerPct, label: 'Varmt lead', beskrivelse: `${dage} dage gammel — handle nu`, farve: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  }
  if (dage <= 60) {
    return { niveau: 'køler', dage, markerPct, label: 'Køler ned', beskrivelse: `${dage} dage gammel — stadig relevant`, farve: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  }
  return { niveau: 'kold', dage, markerPct, label: 'Koldt lead', beskrivelse: `${dage} dage gammel — risiko for at de har fundet andre`, farve: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
}
