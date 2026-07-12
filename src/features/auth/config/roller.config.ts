// src/features/auth/config/roller.config.ts
// Enkelt source of truth for roller, hierarki og menuadgang.
// Tilføj/fjern adgang KUN her — sidebar og brugeradmin læser herfra.

export type BrugerRolle = 'development' | 'direktør' | 'bostedsansvarlig' | 'sygeplejerske';

export const ROLLE_HIERARKI: Record<BrugerRolle, number> = {
  development:      4,
  direktør:         3,
  bostedsansvarlig: 2,
  sygeplejerske:    1,
};

export const ROLLE_LABELS: Record<BrugerRolle, string> = {
  development:      'Development',
  direktør:         'Direktør',
  bostedsansvarlig: 'Bostedsansvarlig',
  sygeplejerske:    'Sygeplejerske',
};

// Hvilke href-præfikser hver rolle har adgang til.
// development har adgang til alt — ingen liste nødvendig.
export const ROLLE_ADGANG: Record<BrugerRolle, string[] | '*'> = {
  development: '*',
  direktør: [
    '/dashboard',
    '/dashboard/markedspotentiale',
    '/dashboard/kommuner',
    '/dashboard/markedsdata',
    '/dashboard/rapporter',
    '/dashboard/alle-rapporter',
    '/dashboard/kunder',
    '/dashboard/markedsforing',
    '/dashboard/monitor',
    '/dashboard/indstillinger',
    '/dashboard/admin/brugere',
  ],
  bostedsansvarlig: [
    '/dashboard',
    '/dashboard/markedspotentiale',
    '/dashboard/kommuner',
    '/dashboard/markedsdata',
    '/dashboard/rapporter',
    '/dashboard/alle-rapporter',
    '/dashboard/kunder',
    '/dashboard/markedsforing',
    '/dashboard/monitor',
    '/dashboard/indstillinger',
    '/dashboard/admin/brugere',
  ],
  sygeplejerske: [
    '/dashboard/markedspotentiale',
    '/dashboard/kommuner',
    '/dashboard/markedsdata',
    '/dashboard/rapporter',
    '/dashboard/alle-rapporter',
    '/dashboard/kunder',
    '/dashboard/indstillinger',
  ],
};

export function harAdgang(rolle: BrugerRolle | null | undefined, href: string): boolean {
  if (!rolle) return false;
  const adgang = ROLLE_ADGANG[rolle];
  if (adgang === '*') return true;
  // Eksakt match eller præfiks-match (men kun /dashboard alene matcher ikke /dashboard/xxx)
  return adgang.some((tilladt) =>
    href === tilladt || (tilladt !== '/dashboard' && href.startsWith(tilladt))
  );
}

export function kanTildelleRolle(tildelerRolle: BrugerRolle | null | undefined, målRolle: BrugerRolle): boolean {
  if (!tildelerRolle) return false;
  return ROLLE_HIERARKI[tildelerRolle] >= ROLLE_HIERARKI[målRolle];
}

export function rollerTilgængeligeFor(tildelerRolle: BrugerRolle | null | undefined): BrugerRolle[] {
  if (!tildelerRolle) return [];
  const maxNiveau = ROLLE_HIERARKI[tildelerRolle];
  return (Object.keys(ROLLE_HIERARKI) as BrugerRolle[]).filter(
    (r) => ROLLE_HIERARKI[r] <= maxNiveau
  );
}
