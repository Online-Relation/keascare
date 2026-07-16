// src/features/regelovervagning/services/RetsinformationService/retsinformationService.ts
// Henter dokumenter fra Retsinformations officielle REST høsteservice.
// Max 1 kald pr. 10 sekunder — vi tilføjer delay mellem kald.
// API: https://data.retsinformation.dk/api/v1/documents

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { vurderRelevans } from '@/features/regelovervagning/services/RelevansService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

const API_BASE = 'https://data.retsinformation.dk/api/v1';
const SØGE_TERMER = [
  'botilbud', 'bosted', 'opholdssted', 'medicinhåndtering',
  'patientsikkerhed', 'journalføring', 'delegation', 'magtanvendelse',
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

async function ventMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hentDokumenterForTerm(term: string): Promise<RetsDoc[]> {
  const url = `${API_BASE}/documents?$filter=contains(title,'${encodeURIComponent(term)}')&$top=25&$orderby=modificationDate desc`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const json = await res.json() as RetsResponse;
  return json.message ?? [];
}

export async function kørRetsinformationImport(): Promise<{ hentet: number; gemt: number; fejl: number }> {
  const supabase = getSupabaseServerClient();
  let hentet = 0;
  let gemt = 0;
  let fejl = 0;

  for (const term of SØGE_TERMER) {
    try {
      const docs = await hentDokumenterForTerm(term);
      hentet += docs.length;

      for (const doc of docs) {
        const externalId = doc.accessionNumber ?? String(doc.id ?? doc.documentId ?? '');
        if (!externalId) continue;

        const tekst = [doc.title ?? '', doc.type ?? '', doc.changeReason ?? ''].join(' ');
        const { score, level, topics, recommendedAction } = vurderRelevans(tekst);

        if (level === 'lav') continue; // Spring uinteressante over

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

        // Tjek om dokumentet allerede eksisterer
        const { data: eksisterende } = await supabase
          .from('regulatory_items')
          .select('id, title, relevance_score')
          .eq('source', 'retsinformation')
          .eq('external_id', externalId)
          .single();

        if (eksisterende) {
          // Gem historik og opdater
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
        }
        gemt++;
      }
    } catch (err) {
      fejl++;
    }
    await ventMs(10_000); // Respekter max 1 kald pr. 10 sek
  }

  await logScraperKørsel('retsinformation', fejl === 0, { hentet, gemt, fejl });
  return { hentet, gemt, fejl };
}
