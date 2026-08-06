// src/lib/config/GlobalFilter/globalFilter.ts

import { cookies } from 'next/headers';

export type VisFilter = 'alle' | 'privat';
export type LosFilter = 'ekskluder' | 'inkluder';
export type ParagrafFilter = 'alle' | 'kun_43';

export const COOKIE_NAVN = 'keascare-vis-filter';
export const COOKIE_LOS = 'keascare-los-filter';
export const COOKIE_PARAGRAF43 = 'keascare-paragraf43-filter';

// Driftsformer der betragtes som kommunale og EKSKLUDERES ved privat-filter
export const KOMMUNALE_DRIFTSFORMER = [
  'Primærkommune',
  'Region',
  'Statslig administrativ enhed',
];

// CVR virksomhedstyper der betragtes som kommunale/offentlige
export const KOMMUNALE_CVR_TYPER = ['KOM', 'REG', 'STAT'];

export async function getVisFilter(): Promise<VisFilter> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE_NAVN)?.value;
  return val === 'privat' ? 'privat' : 'alle';
}

export async function getLosFilter(): Promise<LosFilter> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE_LOS)?.value;
  return val === 'ekskluder' ? 'ekskluder' : 'inkluder';
}

export async function getParagraf43Filter(): Promise<ParagrafFilter> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE_PARAGRAF43)?.value;
  return val === 'kun_43' ? 'kun_43' : 'alle';
}

// Fælles §43-mønster — hold det ét sted, men anvend det direkte med
// .ilike(kolonne, PARAGRAF_43_MØNSTER) ved hvert kald (Supabase-query-typen
// er for dybt genereret til at kunne wrappes generisk uden TS-timeout).
export const PARAGRAF_43_MØNSTER = '%43%';
// Markør sat på rapport_url når der IKKE er en ægte STPS-tilsynsrapport —
// bruges til at kræve en ægte rapport ved siden af §43-mønsteret.
export const SYNTETISK_RAPPORT_MØNSTER = 'stps://genereret/%';

// PostgREST not.in filter-streng til brug i Supabase-queries
export function driftsformFilterStreng(): string {
  return `(${KOMMUNALE_DRIFTSFORMER.map((d) => `"${d}"`).join(',')})`;
}

// Brug begge funktioner med to separate .or()-kald på Supabase-query (ANDes automatisk):
//   query.or(privatFilterTpOr()).or(privatFilterCvrOr())
// Resultat: (tp_driftsform IS NULL OR ikke kommunal) AND (cvr_virksomhedstype IS NULL OR ikke kommunal)

export function privatFilterTpOr(): string {
  const ikkeKommunal = `tp_driftsform.not.in.(${KOMMUNALE_DRIFTSFORMER.join(',')})`;
  return `tp_driftsform.is.null,${ikkeKommunal}`;
}

export function privatFilterCvrOr(): string {
  const ikkeKommunal = `cvr_virksomhedstype.not.in.(${KOMMUNALE_CVR_TYPER.join(',')})`;
  return `cvr_virksomhedstype.is.null,${ikkeKommunal}`;
}

// Bagudkompatibel alias — bruges af eksisterende kaldere
export function privatFilterOr(): string {
  return privatFilterTpOr();
}
