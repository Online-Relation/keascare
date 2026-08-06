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
  development:      'Udvikler',
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
    '/dashboard/kort',
    '/dashboard/rapporter',
    '/dashboard/alle-rapporter',
    '/dashboard/kunder',
    '/dashboard/produkter',
    '/dashboard/pakker',
    '/dashboard/markedsforing',
    '/dashboard/regelovervagning',
    '/dashboard/monitor',
    '/dashboard/indstillinger',
    '/dashboard/admin/brugere',
  ],
  bostedsansvarlig: [
    '/dashboard',
    '/dashboard/markedspotentiale',
    '/dashboard/kommuner',
    '/dashboard/markedsdata',
    '/dashboard/kort',
    '/dashboard/rapporter',
    '/dashboard/alle-rapporter',
    '/dashboard/kunder',
    '/dashboard/produkter',
    '/dashboard/tidsregistrering',
    '/dashboard/pakker',
    '/dashboard/markedsforing',
    '/dashboard/regelovervagning',
    '/dashboard/monitor',
    '/dashboard/indstillinger',
    '/dashboard/admin/brugere',
  ],
  sygeplejerske: [
    '/dashboard',
    '/dashboard/markedspotentiale',
    '/dashboard/kommuner',
    '/dashboard/markedsdata',
    '/dashboard/rapporter',
    '/dashboard/alle-rapporter',
    '/dashboard/kunder',
    '/dashboard/produkter',
    '/dashboard/indstillinger',
  ],
};

// Menneskelig beskrivelse af hvert menupunkt — bruges i adgangsoversigten.
// Afledt af NAV_GRUPPER (samme liste som sidebaren bruger), så de to ALTID
// matcher. Tilføj/fjern menupunkter i navigation.config.ts — ikke her.
export { NAV_GRUPPER as MENU_PUNKTER } from '@/features/dashboard/config/NavigationConfig/navigation.config';

function matcherSti(stier: string[], href: string): boolean {
  // Eksakt match eller præfiks-match (men kun /dashboard alene matcher ikke /dashboard/xxx)
  return stier.some((tilladt) =>
    href === tilladt || (tilladt !== '/dashboard' && href.startsWith(tilladt))
  );
}

export function harAdgang(rolle: BrugerRolle | null | undefined, href: string): boolean {
  if (!rolle) return false;
  const adgang = ROLLE_ADGANG[rolle];
  if (adgang === '*') return true;
  return matcherSti(adgang, href);
}

// Samme som harAdgang, men bruger de DB-gemte rettigheder fra
// RolleRettighederProvider når en rolle har fået gemt en rettighedsliste.
// Falder tilbage til den statiske ROLLE_ADGANG for roller der aldrig er
// blevet gemt eksplicit (fx lige efter deploy, før nogen har trykket
// "Gem rettigheder") — så ingen bliver låst ude ved et uheld.
export function harDynamiskAdgang(
  rolle: BrugerRolle | null | undefined,
  href: string,
  dbRettigheder: Partial<Record<BrugerRolle, string[]>>,
): boolean {
  if (!rolle) return false;
  if (rolle === 'development') return true;

  const gemteStier = dbRettigheder[rolle];
  if (gemteStier) return matcherSti(gemteStier, href);

  return harAdgang(rolle, href);
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
