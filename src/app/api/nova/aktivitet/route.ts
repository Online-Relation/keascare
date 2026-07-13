// src/app/api/nova/aktivitet/route.ts
// Returnerer Novas aktuelle aktivitetsstatus.
// Tjekker reelle scraper-kørsler først — ellers simulerer tidsbaseret aktivitet.

import { NextResponse } from 'next/server';
import { hentAlleScraperStatus } from '@/lib/db/ScraperStatus';

export type NovaAktivitet = {
  status: 'aktiv' | 'optaget' | 'fraværende';
  opgave: string | null; // Hvad Nova er i gang med (kun når optaget)
  erRigtig: boolean;     // true = rigtig kørsel, false = simuleret
};

// Mapning fra scraper-id til Novas beskrivelse af opgaven
const SCRAPER_OPGAVE: Record<string, string> = {
  'stps-liste':              'Henter nye STPS-tilsynsrapporter',
  'stps-detaljer':           'Analyserer tilsynsrapporter',
  'stps-fund-items':         'Udtræk fund-data fra rapporter',
  'stps-pnummer':            'Matcher P-numre i rapporter',
  'cvr-berig':               'Slår CVR-data op for bosteder',
  'cvr-ansatte':             'Opdaterer ansatte og virksomhedsdata',
  'cvr-signaler':            'Scanner CVR for nye bosted-registreringer',
  'tilbudsportalen-liste':   'Henter data fra Tilbudsportalen',
  'tilbudsportalen-detaljer':'Analyserer tilbudsprofiler fra Tilbudsportalen',
  'tilbudsportalen-match':   'Matcher bosteder med tilsynsrapporter',
  'monday-match':            'Synkroniserer med Monday CRM',
  'monday-sync':             'Opdaterer kundedata fra Monday',
  'dst':                     'Henter kommunedata fra Danmarks Statistik',
};

// Simulerede opgaver Nova kan vise i rolige perioder
const SIMULEREDE_OPGAVER = [
  'Gennemgår CVR-registreringer for nye bosteder',
  'Analyserer markedssignaler fra datakilder',
  'Overvåger nye bosted-registreringer',
  'Validerer datakvalitet på eksisterende bosteder',
  'Scanner tilsynshistorik for mønstre',
  'Tjekker opdateringer fra Tilbudsportalen',
  'Analyserer kommunale behov og kapacitet',
  'Krydstjekker STPS-data med CRM',
];

// Deterministisk pseudo-tilfældig baseret på dato + 15-min slot
function simulerAktivitet(nu: Date): NovaAktivitet {
  const slot = Math.floor(nu.getMinutes() / 15); // 0-3
  const seed = nu.getDate() * 10000 + nu.getHours() * 100 + slot;
  const hash = ((seed * 1103515245 + 12345) & 0x7fffffff);

  // ~20% af slots er optaget, ~5% fraværende
  const pct = hash % 100;
  if (pct < 5) return { status: 'fraværende', opgave: null, erRigtig: false };
  if (pct < 25) {
    const opgaveIdx = hash % SIMULEREDE_OPGAVER.length;
    return {
      status: 'optaget',
      opgave: SIMULEREDE_OPGAVER[opgaveIdx],
      erRigtig: false,
    };
  }
  return { status: 'aktiv', opgave: null, erRigtig: false };
}

export async function GET() {
  try {
    const statuser = await hentAlleScraperStatus();
    const kørende = statuser.filter((s) => s.status === 'kører');

    if (kørende.length > 0) {
      // Find den scraper der kørte sidst (mest aktuel)
      const sidst = kørende.sort((a, b) =>
        (b.startetKl ?? '').localeCompare(a.startetKl ?? '')
      )[0];

      return NextResponse.json({
        status: 'optaget',
        opgave: SCRAPER_OPGAVE[sidst.scraperId] ?? `Kørsel: ${sidst.scraperId}`,
        erRigtig: true,
      } satisfies NovaAktivitet);
    }
  } catch {
    // Hvis DB fejler, fald tilbage til simulering
  }

  return NextResponse.json(simulerAktivitet(new Date()));
}
