// src/app/api/notifikationer/route.ts
// Returnerer notifikationer til development-brugere — primært scraper-kørsler og systemhændelser.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

export type Notifikation = {
  id: string;
  titel: string;
  besked: string;
  type: 'succes' | 'fejl' | 'info' | 'advarsel';
  tidspunkt: string;
  læst: boolean;
};

export async function GET() {
  const auth = await getAuthClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ notifikationer: [] });

  const rolle = user.user_metadata?.rolle ?? '';
  if (rolle !== 'development') return NextResponse.json({ notifikationer: [] });

  const supabase = getSupabaseServerClient();

  // Hent de seneste 20 scraper-kørsler
  const { data: logs } = await supabase
    .from('scraper_log')
    .select('id, kilde, status, koersel_start, koersel_slut, antal_fundet, antal_nye, fejl_besked')
    .order('koersel_start', { ascending: false })
    .limit(20);

  const notifikationer: Notifikation[] = (logs ?? []).map((log) => {
    const erFejl = log.status === 'fejl';
    const navn = SCRAPER_NAVNE[log.kilde as string] ?? log.kilde;
    const tidspunkt = log.koersel_slut ?? log.koersel_start ?? new Date().toISOString();

    if (erFejl) {
      return {
        id: log.id,
        titel: `${navn} fejlede`,
        besked: log.fejl_besked ?? 'Ukendt fejl',
        type: 'fejl' as const,
        tidspunkt,
        læst: false,
      };
    }

    const nye = log.antal_nye ?? 0;
    return {
      id: log.id,
      titel: navn,
      besked: nye > 0
        ? `Fandt ${log.antal_fundet ?? 0} — ${nye} nye tilføjet`
        : `Fandt ${log.antal_fundet ?? 0} — ingen nye`,
      type: nye > 0 ? 'succes' as const : 'info' as const,
      tidspunkt,
      læst: false,
    };
  });

  return NextResponse.json({ notifikationer });
}

const SCRAPER_NAVNE: Record<string, string> = {
  'stps-liste':               'STPS — Rapportliste',
  'stps-detaljer':            'STPS — PDF-parsing',
  'stps-fund-items':          'STPS — Fund-items',
  'stps-pnummer':             'STPS — P-nummer',
  'cvr-berig':                'CVR — Berigelse',
  'cvr-ansatte':              'CVR — Ansatte',
  'cvr-signaler':             'CVR — Signaler',
  'tilbudsportalen-liste':    'Tilbudsportalen — Liste',
  'tilbudsportalen-detaljer': 'Tilbudsportalen — Detaljer',
  'monday-match':             'Monday — Match',
  'monday-sync':              'Monday — Sync',
  'dst':                      'Danmarks Statistik',
};
