// src/app/api/nova/beskeder/route.ts
// Returnerer personaliserede Nova-beskeder til den indloggede bruger.
// Opdaterer brugerens last_seen EFTER at beskeder er beregnet.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { beregnNovaBeskeder } from '@/features/nova/services/NovaBeskedService';

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
}

export async function GET() {
  const auth = await getAuthClient();
  const { data: { user } } = await auth.auth.getUser();

  if (!user) return NextResponse.json({ beskeder: [] });

  const brugerNavn: string = user.user_metadata?.navn ?? user.email ?? '';
  const supabase = getSupabaseServerClient();

  // Hent sidst_set FØR vi opdaterer — ellers viser vi altid 0 nye
  const { data: lastSeen } = await supabase
    .from('bruger_last_seen')
    .select('sidst_set')
    .eq('bruger_id', user.id)
    .maybeSingle();

  const sidstSet = lastSeen?.sidst_set ?? null;

  // Beregn beskeder baseret på sidst_set
  const beskeder = await beregnNovaBeskeder(user.id, brugerNavn, sidstSet, supabase);

  // Opdater sidst_set til nu — næste login ser kun hvad der er nyt herefter
  await supabase
    .from('bruger_last_seen')
    .upsert({ bruger_id: user.id, sidst_set: new Date().toISOString() }, { onConflict: 'bruger_id' });

  return NextResponse.json({ beskeder });
}
