// src/features/regelovervagning/services/RetsinformationService/retsinformationService.ts
// Henter dokumenter fra Retsinformations officielle REST høsteservice.
// Max 1 kald pr. 10 sekunder — vi tilføjer delay mellem kald.
// API: https://data.retsinformation.dk/api/v1/documents

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { vurderRelevans } from '@/features/regelovervagning/services/RelevansService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

const API_BASE = 'https://data.retsinformation.dk/api/v1';

// Relevante nøgleord til at filtrere dokumenter efter hentning
const RELEVANTE_ORD = [
  'botilbud', 'bosted', 'opholdssted', 'medicin', 'patientsikkerhed',
  'journalføring', 'delegation', 'magtanvendelse', 'serviceloven',
  'tilsyn', 'handicap', 'psykiatri', 'plejetilbud',
];

type RetsDoc = {
  id: number;
  documentId?: string;
  accessionNumber?: string;
  title?: string;
  type?: string;
  changeReason?: string;
  modificationDate?: string;
  href?: string;
};

type RetsResponse = {
  message?: RetsDoc[];
  totalResults?: number;
};

function erRelevant(doc: RetsDoc): boolean {
  const tekst = [doc.title ?? '', doc.type ?? '', doc.changeReason ?? ''].join(' ').toLowerCase();
  return RELEVANTE_ORD.some((ord) => tekst.includes(ord));
}

export async function kørRetsinformationImport(): Promise<{ hentet: number; gemt: number; fejl: number; fejlBeskeder?: string[] }> {
  const supabase = getSupabaseServerClient();
  let hentet = 0;
  let gemt = 0;
  let fejl = 0;
  const fejlBeskeder: string[] = [];

  try {
    // Ét enkelt kald — hent de 100 senest ændrede dokumenter og filtrer lokalt
    const url = `${API_BASE}/documents?$top=100&$orderby=modificationDate%20desc`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    }

    const json = await res.json() as RetsResponse;
    const docs = json.message ?? [];
    console.log('[Retsinformation] Hentet', docs.length, 'dokumenter fra API');

    const relevante = docs.filter(erRelevant);
    hentet = relevante.length;
    console.log('[Retsinformation]', relevante.length, 'er relevante efter filtrering');

    for (const doc of relevante) {
      const externalId = doc.accessionNumber ?? String(doc.id ?? doc.documentId ?? '');
      if (!externalId) continue;

      const tekst = [doc.title ?? '', doc.type ?? '', doc.changeReason ?? ''].join(' ');
      const { score, level, topics, recommendedAction } = vurderRelevans(tekst);

      if (level === 'lav') continue;

      const nytItem = {
        source: 'retsinformation',
        external_id: externalId,
        source_type: doc.type ?? null,
        title: doc.title ?? externalId,
        summary: doc.changeReason ?? null,
        source_url: doc.href ?? `https://www.retsinformation.dk/eli/${externalId}`,
        published_at: doc.modificationDate ?? null,
        changed_at_source: doc.modificationDate ?? null,
        last_seen_at: new Date().toISOString(),
        relevance_score: score,
        relevance_level: level,
        topics,
        recommended_action: recommendedAction,
        raw_payload: doc as unknown as Record<string, unknown>,
      };

      const { data: eksisterende } = await supabase
        .from('regulatory_items')
        .select('id, title, relevance_score')
        .eq('source', 'retsinformation')
        .eq('external_id', externalId)
        .single();

      if (eksisterende) {
        await supabase.from('regulatory_item_history').insert({
          item_id: eksisterende.id,
          change_reason: doc.changeReason ?? 'Opdateret ved import',
          snapshot: eksisterende as unknown as Record<string, unknown>,
        });
        await supabase
          .from('regulatory_items')
          .update({ ...nytItem, first_seen_at: undefined })
          .eq('id', eksisterende.id);
      } else {
        await supabase.from('regulatory_items').insert({
          ...nytItem,
          first_seen_at: new Date().toISOString(),
        });
        gemt++;
      }
    }
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    console.error('[Retsinformation]', besked);
    fejlBeskeder.push(besked);
    fejl++;
  }

  await logScraperKørsel('retsinformation', fejl === 0, { hentet, gemt, fejl });
  return { hentet, gemt, fejl, fejlBeskeder: fejlBeskeder.length > 0 ? fejlBeskeder : undefined };
}
