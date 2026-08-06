// src/lib/config/GlobalFilter/globalFilter.ts

import { cookies } from 'next/headers';

export type VisFilter = 'alle' | 'privat';
export type LosFilter = 'ekskluder' | 'inkluder';
// 'alle' = §43 vises IKKE (default) — kun §107/§108 som hidtil.
// 'inkluder_43' = §43 TILFØJES oveni §107/§108 — men kun §43-rækker der har
// en ægte STPS-tilsynsrapport. Intet fjernes nogensinde — det er en
// tilføjelse, ikke et eksklusivt filter.
export type ParagrafFilter = 'alle' | 'inkluder_43';

export const COOKIE_NAVN = 'keascare-vis-filter';
export const COOKIE_LOS = 'keascare-los-filter';
export const COOKIE_PARAGRAF43 = 'keascare-paragraf43-filter';

// Driftsformer der betragtes som kommunale og EKSKLUDERES ved privat-filter.
// Bruges kun til visning (chips i Indstillinger) — selve filtreringen sker
// via KOMMUNALE_NØGLEORD nedenfor, da Tilbudsportalen skriver driftsformen
// i flere varianter ("Kommune", "Primærkommune", "Fælleskommunal" osv.), og
// et eksakt match snød §43-tilbud forbi filteret.
export const KOMMUNALE_DRIFTSFORMER = [
  'Primærkommune',
  'Region',
  'Statslig administrativ enhed',
];

// Nøgleord der matches som substring (case-insensitive) mod tp_driftsform —
// fanger alle Tilbudsportalens stavevarianter af kommunal/regional/statslig drift.
export const KOMMUNALE_NØGLEORD = ['kommun', 'region', 'stat'];

export function erKommunalDriftsform(driftsform: string | null | undefined): boolean {
  if (!driftsform) return false;
  const norm = driftsform.toLowerCase();
  return KOMMUNALE_NØGLEORD.some((ord) => norm.includes(ord));
}

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
  return val === 'inkluder_43' ? 'inkluder_43' : 'alle';
}

// Fælles §43-mønster til brug i .ilike()-kald.
export const PARAGRAF_43_MØNSTER = '%43%';
// Markør sat på rapport_url når der IKKE er en ægte STPS-tilsynsrapport —
// bruges til at kræve en ægte rapport for §43-rækker specifikt.
export const SYNTETISK_RAPPORT_MØNSTER = 'stps://genereret/%';

// .or()-streng der EKSKLUDERER §43 helt — brugt når paragraf43Filter er 'alle'
// (default). tp_tilbudstype IS NULL bevares altid (ikke TP-matchet endnu).
export function paragraf43EkskluderOr(): string {
  return `tp_tilbudstype.is.null,tp_tilbudstype.not.ilike.${PARAGRAF_43_MØNSTER}`;
}

// .or()-streng der TILFØJER §43 oveni det eksisterende — brugt når
// paragraf43Filter er 'inkluder_43'. §107/§108/null-rækker påvirkes ikke;
// §43-rækker kræver en ægte STPS-tilsynsrapport (ikke en syntetisk
// placeholder-URL) for at blive medtaget.
export function paragraf43InkluderOr(): string {
  return [
    'tp_tilbudstype.is.null',
    `tp_tilbudstype.not.ilike.${PARAGRAF_43_MØNSTER}`,
    `and(tp_tilbudstype.ilike.${PARAGRAF_43_MØNSTER},rapport_url.not.ilike.${SYNTETISK_RAPPORT_MØNSTER})`,
  ].join(',');
}

// PostgREST not.in filter-streng til brug i Supabase-queries
export function driftsformFilterStreng(): string {
  return `(${KOMMUNALE_DRIFTSFORMER.map((d) => `"${d}"`).join(',')})`;
}

// Brug begge funktioner med to separate .or()-kald på Supabase-query (ANDes automatisk):
//   query.or(privatFilterTpOr()).or(privatFilterCvrOr())
// Resultat: (tp_driftsform IS NULL OR ikke kommunal) AND (cvr_virksomhedstype IS NULL OR ikke kommunal)

export function privatFilterTpOr(): string {
  // and(...)-gruppe: driftsformen må IKKE indeholde noget af nøgleordene
  const ikkeKommunal = `and(${KOMMUNALE_NØGLEORD.map((ord) => `tp_driftsform.not.ilike.%${ord}%`).join(',')})`;
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
