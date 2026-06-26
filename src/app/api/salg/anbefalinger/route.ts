// src/app/api/salg/anbefalinger/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/api/AnthropicClient';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { SalgsAnbefalinger } from '@/features/dashboard/types/salg.types';

const SYSTEM_PROMPT = `Du er en ekspert salgskonsulent for KeasCare — en virksomhed af erfarne, specialiserede sygeplejersker der hjælper bosteder (§107 og §108) med at sikre høj faglig standard og patientsikkerhed.

KeasCares kerneydelser:
• Minitilsyn — KeasCare gennemfører et internt tilsyn inden det officielle STPS-tilsyn, så bostedet er forberedt
• Kursus i medicinhåndtering — praktisk og godkendt undervisning til pædagoger og personale
• Sundhedsfaglige instrukser — KeasCare udarbejder klare, lovmedholdige instrukser tilpasset bostedet
• Sygeplejefagligt abonnement — fast tilknyttet sygeplejerske der er tilgængelig løbende
• Akuthjælp — hurtig assistance hvis der opstår problemer eller et tilsyn er varslet
• Brand og Første Hjælp kursus

KeasCares profil:
• Mere end 100 bosteder som kunder
• Erfarne sygeplejersker med speciale i botilbud
• Fleksible og omkostningsbevidste løsninger
• Fast, dedikeret sygeplejerske til hvert bosted — ikke en anonym hotline
• Fokus på at gøre sundhedsfaglige krav simple og handlingsrettede

Din opgave:
Du modtager data fra en STPS-tilsynsrapport for et konkret bosted. Analyser rapporten og generer skarpe, konkrete salgsindsigter til brug i et koldt opkald. Vær specifik — brug rapportens faktiske fund. Undgå generiske sætninger.

Du skal returnere et JSON-objekt med præcis denne struktur (ingen markdown, kun raw JSON):
{
  "åbning": "En konkret, naturlig indledningssætning sælgeren kan sige næsten ord for ord. Max 2 sætninger. Nævn rapporten og dens dato.",
  "signaler": [
    {
      "titel": "Kort titel på signalet",
      "observation": "Hvad rapporten konkret viser — baseret på de faktiske fund",
      "relevans": "Hvorfor dette er relevant for bostedet lige nu",
      "ydelse": "Den KeasCare-ydelse der løser dette",
      "salgspunkt": "Konkret sætning sælgeren kan bruge i opkaldet"
    }
  ],
  "tone": "Kort vejledning om tonen i opkaldet baseret på alvorligheden (fx: vær støttende og løsningsorienteret, ikke konfronterende)",
  "næsteSteg": "Konkret forslag til hvad sælgeren skal afslutte opkaldet med at foreslå"
}

Generer 2-4 signaler. Prioritér de mest alvorlige fund. Vær professionel, empatisk og løsningsorienteret — KeasCare er en partner, ikke en kontrollant.`;

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ fejl: 'Mangler id' }, { status: 400 });

  const supabase = getSupabaseServerClient();

  // Tjek om vi allerede har cachet anbefalinger
  const { data: existing } = await supabase
    .from('stps_rapporter')
    .select('salgs_anbefalinger')
    .eq('id', id)
    .single();

  if (existing?.salgs_anbefalinger) {
    return NextResponse.json({ anbefalinger: existing.salgs_anbefalinger });
  }

  // Hent rapport-data til analyse
  const { data: rapport, error } = await supabase
    .from('stps_rapporter')
    .select('stps_tilbud_navn, rapport_dato, fund_niveau, stps_konklusion, temaer, fokus_omraader, pdf_vurdering, fund_items, kommune, tp_tilbudstype')
    .eq('id', id)
    .single();

  if (error || !rapport) {
    return NextResponse.json({ fejl: 'Rapport ikke fundet' }, { status: 404 });
  }

  const dato = rapport.rapport_dato
    ? new Date(rapport.rapport_dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'ukendt dato';

  const brugerBesked = `
Bosted: ${rapport.stps_tilbud_navn}
Kommune: ${rapport.kommune ?? 'ukendt'}
Tilbudstype: ${rapport.tp_tilbudstype ?? 'ukendt'}
Rapportdato: ${dato}
Fund-niveau: ${rapport.fund_niveau}
Konklusion/sanktioner: ${rapport.stps_konklusion ?? 'ingen'}
Temaer: ${(rapport.temaer as string[] | null)?.join(', ') ?? 'ingen'}
Fokusområder: ${(rapport.fokus_omraader as string[] | null)?.join(', ') ?? 'ingen'}

Vurdering fra rapporten:
${rapport.pdf_vurdering ?? 'Ikke tilgængelig'}

Strukturerede fund:
${rapport.fund_items ? JSON.stringify(rapport.fund_items, null, 2) : 'Ikke tilgængelig'}
  `.trim();

  try {
    const anthropic = getAnthropicClient();
    const besked = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: brugerBesked }],
    });

    const råTekst = besked.content[0].type === 'text' ? besked.content[0].text : '';
    console.log('Anthropic råsvar:', råTekst.slice(0, 300));

    // Strip markdown-kodeblok hvis Claude pakkede svaret i ```json ... ```
    const rensetTekst = råTekst
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim();

    const anbefalinger: SalgsAnbefalinger = JSON.parse(rensetTekst);

    // Gem i DB så næste kald er øjeblikkeligt
    await supabase
      .from('stps_rapporter')
      .update({ salgs_anbefalinger: anbefalinger })
      .eq('id', id);

    return NextResponse.json({ anbefalinger });
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    console.error('Anthropic fejl:', besked);
    return NextResponse.json({ fejl: `Fejl: ${besked}` }, { status: 500 });
  }
}
