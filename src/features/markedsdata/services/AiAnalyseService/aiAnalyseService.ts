// src/features/markedsdata/services/AiAnalyseService/aiAnalyseService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { getAnthropicClient } from '@/lib/api/AnthropicClient';
import type { DstKommuneRå, DstÅrTotal } from '@/lib/api/DstClient';

export type AiAnalyse = {
  id: string;
  type: string;
  tekst: string;
  genereret_dato: string;
  model: string | null;
  tokens_brugt: number | null;
};

export async function hentSenesteAiAnalyse(type = 'markedsdata'): Promise<AiAnalyse | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('ai_analyser')
    .select('*')
    .eq('type', type)
    .order('genereret_dato', { ascending: false })
    .limit(1)
    .single();
  return (data as AiAnalyse | null) ?? null;
}

type AnalyseInput = {
  totalBosteder: number;
  antalKunder: number;
  antalKritiske: number;
  antalAldrigKontaktet: number;
  topKommuner: { kommune: string; borgere: number; antalBosteder: number; antalKunder: number }[];
  nyeKritiskeFund: { navn: string; kommune: string | null; fundNiveau: string; rapportDato: string | null }[];
  dstTrend: DstÅrTotal[];
};

function byggPrompt(input: AnalyseInput): string {
  const konverteringsrate = input.totalBosteder > 0
    ? ((input.antalKunder / input.totalBosteder) * 100).toFixed(1)
    : '0';

  const kommuneOversigt = input.topKommuner
    .map((k) => {
      const dækning = k.antalBosteder > 0
        ? Math.round((k.antalKunder / k.antalBosteder) * 100)
        : 0;
      return `  - ${k.kommune}: ${k.borgere.toLocaleString('da-DK')} borgere i §107/§108, ${k.antalBosteder} bosteder, ${k.antalKunder} KeasCare-kunder (${dækning}% dækning)`;
    })
    .join('\n');

  const kritiskeOpslag = input.nyeKritiskeFund.slice(0, 8)
    .map((b) => {
      const dato = b.rapportDato ? new Date(b.rapportDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : 'ukendt dato';
      return `  - ${b.navn}${b.kommune ? ` (${b.kommune})` : ''} – ${b.fundNiveau === 'kritisk' ? 'KRITISK fund' : 'Større fund'} – rapport ${dato}`;
    })
    .join('\n');

  const dstTrend = input.dstTrend.slice(-3)
    .map((d) => `  ${d.år}: §107=${d.p107.toLocaleString('da-DK')}, §108=${d.p108.toLocaleString('da-DK')}`)
    .join('\n');

  return `Du er salgsanalytiker for KeasCare, der sælger tilsynshjælp og fagsystemer til private bosteder i Danmark (§107 og §108 botilbud).

Opgave: Skriv en præcis og handlingsorienteret månedlig analyse for KeasCare's salgsteam. Analysen skal hjælpe dem med at prioritere de 2-3 opkald de foretager i løbet af måneden.

MARKEDSDATA (aktuelle tal):
- Total relevante bosteder: ${input.totalBosteder.toLocaleString('da-DK')}
- KeasCare-kunder: ${input.antalKunder.toLocaleString('da-DK')} (${konverteringsrate}% af markedet)
- Bosteder med kritiske/større STPS-fund: ${input.antalKritiske.toLocaleString('da-DK')}
- Bosteder aldrig kontaktet: ${input.antalAldrigKontaktet.toLocaleString('da-DK')}

TOP KOMMUNER (rangeret efter markedsstørrelse):
${kommuneOversigt}

BOSTEDER MED NYLIGE KRITISKE ELLER STØRRE FUND (ikke KeasCare-kunder):
${kritiskeOpslag || '  Ingen nye kritiske fund denne måned'}

DST-TREND (borgere i botilbud nationalt):
${dstTrend}

REGLER FOR ANALYSEN:
- Skriv på dansk, professionelt og konkret
- Brug de rigtige tal fra data ovenfor — opfind ingen tal
- Analysen skal give 3-4 konkrete, handlingsorienterede observationer
- Fremhæv de kommuner eller bosteder der repræsenterer størst uudnyttet potentiale
- Nævn hvis der er kommuner med lav dækning trods mange borgere
- Afslut med én kort sætning om markedsudviklingen baseret på DST-trenden
- Maksimalt 200 ord i alt
- Ingen punktopstilling med stjerner eller bindestreger — skriv i sammenhængende sætninger organiseret i 2-3 korte afsnit`;
}

export async function genererAiAnalyse(
  dstData: DstKommuneRå[],
  dstTrend: DstÅrTotal[],
): Promise<AiAnalyse> {
  const supabase = getSupabaseServerClient();

  // Hent bosteder-data
  const { data: råData } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, kommune, fund_niveau, rapport_dato, monday_item_id')
    .order('rapport_dato', { ascending: false, nullsFirst: false });

  const rækker = (råData ?? []) as {
    id: string; stps_tilbud_navn: string; kommune: string | null;
    fund_niveau: string | null; rapport_dato: string | null; monday_item_id: string | null;
  }[];

  const totalBosteder = rækker.length;
  const antalKunder = rækker.filter((r) => !!r.monday_item_id).length;
  const antalKritiske = rækker.filter((r) => r.fund_niveau === 'kritisk' || r.fund_niveau === 'stoerre').length;
  const antalAldrigKontaktet = rækker.filter((r) => !r.monday_item_id).length;

  // Top kommuner fra DST krydset med bosteder
  const kommuneKunder = new Map<string, number>();
  const kommuneBosteder = new Map<string, number>();
  for (const r of rækker) {
    const k = r.kommune ?? 'Ukendt';
    kommuneBosteder.set(k, (kommuneBosteder.get(k) ?? 0) + 1);
    if (r.monday_item_id) kommuneKunder.set(k, (kommuneKunder.get(k) ?? 0) + 1);
  }

  const topKommuner = dstData.slice(0, 8).map((k) => ({
    kommune: k.kommune,
    borgere: k.total,
    antalBosteder: kommuneBosteder.get(k.kommune) ?? 0,
    antalKunder: kommuneKunder.get(k.kommune) ?? 0,
  }));

  // Nylige kritiske fund der ikke er kunder
  const for30Dage = new Date();
  for30Dage.setDate(for30Dage.getDate() - 30);
  const nyeKritiskeFund = rækker
    .filter((r) => !r.monday_item_id && (r.fund_niveau === 'kritisk' || r.fund_niveau === 'stoerre'))
    .slice(0, 8)
    .map((r) => ({
      navn: r.stps_tilbud_navn,
      kommune: r.kommune,
      fundNiveau: r.fund_niveau ?? 'ukendt',
      rapportDato: r.rapport_dato,
    }));

  const prompt = byggPrompt({ totalBosteder, antalKunder, antalKritiske, antalAldrigKontaktet, topKommuner, nyeKritiskeFund, dstTrend });

  const anthropic = getAnthropicClient();
  const svar = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 600,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });

  const tekstBlok = svar.content.find((b) => b.type === 'text');
  const tekst = tekstBlok?.type === 'text' ? tekstBlok.text : 'Analyse kunne ikke genereres.';
  const tokensInput = svar.usage?.input_tokens ?? 0;
  const tokensOutput = svar.usage?.output_tokens ?? 0;

  const { data: gemt, error } = await supabase
    .from('ai_analyser')
    .insert({
      type: 'markedsdata',
      tekst,
      genereret_dato: new Date().toISOString(),
      model: svar.model,
      tokens_brugt: tokensInput + tokensOutput,
    })
    .select()
    .single();

  if (error || !gemt) throw new Error(`Kunne ikke gemme AI-analyse: ${error?.message}`);
  return gemt as AiAnalyse;
}
