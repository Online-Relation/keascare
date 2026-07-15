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

export function beregnLeadVarme(rapportDato: string | null): LeadVarmeInfo {
  if (!rapportDato) {
    return { niveau: 'ukendt', dage: -1, label: 'Ukendt', beskrivelse: 'Ingen rapportdato', farve: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' };
  }

  const dage = Math.floor((Date.now() - new Date(rapportDato).getTime()) / (1000 * 60 * 60 * 24));

  if (dage <= 30) {
    return { niveau: 'varm', dage, label: 'Varmt lead', beskrivelse: `${dage} dage gammel — handle nu`, farve: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  }
  if (dage <= 60) {
    return { niveau: 'køler', dage, label: 'Køler ned', beskrivelse: `${dage} dage gammel — stadig relevant`, farve: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  }
  return { niveau: 'kold', dage, label: 'Koldt lead', beskrivelse: `${dage} dage gammel — risiko for at de har fundet andre`, farve: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
}
