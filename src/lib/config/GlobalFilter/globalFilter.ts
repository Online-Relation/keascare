// src/lib/config/GlobalFilter/globalFilter.ts

import { cookies } from 'next/headers';

export type VisFilter = 'alle' | 'privat';

export const COOKIE_NAVN = 'keascare-vis-filter';

// Driftsformer der betragtes som kommunale og EKSKLUDERES ved privat-filter
export const KOMMUNALE_DRIFTSFORMER = [
  'Primærkommune',
  'Region',
  'Statslig administrativ enhed',
];

export async function getVisFilter(): Promise<VisFilter> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE_NAVN)?.value;
  return val === 'privat' ? 'privat' : 'alle';
}

// PostgREST not.in filter-streng til brug i Supabase-queries
export function driftsformFilterStreng(): string {
  return `(${KOMMUNALE_DRIFTSFORMER.map((d) => `"${d}"`).join(',')})`;
}
