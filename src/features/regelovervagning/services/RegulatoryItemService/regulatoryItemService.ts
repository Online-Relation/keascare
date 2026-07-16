// src/features/regelovervagning/services/RegulatoryItemService/regulatoryItemService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type {
  RegulatoryItem, RegulatorySource, RelevanceLevel, ReviewStatus,
  RegulatoryItemHistory, RegelovervagningOverblik, RegulatoryTopic,
} from '@/features/regelovervagning/types/regulatory.types';
import { hentSenesteLog } from '@/lib/db/ScraperLog';

function mapItem(r: Record<string, unknown>): RegulatoryItem {
  return {
    id:               r.id as string,
    source:           r.source as RegulatorySource,
    externalId:       r.external_id as string,
    sourceType:       (r.source_type as string) ?? null,
    title:            r.title as string,
    summary:          (r.summary as string) ?? null,
    bodyText:         (r.body_text as string) ?? null,
    sourceUrl:        (r.source_url as string) ?? null,
    publishedAt:      (r.published_at as string) ?? null,
    changedAtSource:  (r.changed_at_source as string) ?? null,
    firstSeenAt:      r.first_seen_at as string,
    lastSeenAt:       r.last_seen_at as string,
    relevanceScore:   (r.relevance_score as number) ?? 0,
    relevanceLevel:   (r.relevance_level as RelevanceLevel) ?? 'lav',
    topics:           (r.topics as RegulatoryTopic[]) ?? [],
    recommendedAction:(r.recommended_action as string) ?? null,
    reviewStatus:     (r.review_status as ReviewStatus) ?? 'ny',
    internalNote:     (r.internal_note as string) ?? null,
  };
}

export type RegulatoryFilter = {
  source?: RegulatorySource;
  relevanceLevel?: RelevanceLevel;
  reviewStatus?: ReviewStatus;
  topic?: RegulatoryTopic;
  søgning?: string;
  fra?: string;
  til?: string;
};

export async function hentRegulatoryItems(filter: RegulatoryFilter = {}): Promise<RegulatoryItem[]> {
  const supabase = getSupabaseServerClient();
  let q = supabase
    .from('regulatory_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(200);

  if (filter.source)         q = q.eq('source', filter.source);
  if (filter.relevanceLevel) q = q.eq('relevance_level', filter.relevanceLevel);
  if (filter.reviewStatus)   q = q.eq('review_status', filter.reviewStatus);
  if (filter.topic)          q = q.contains('topics', [filter.topic]);
  if (filter.fra)            q = q.gte('published_at', filter.fra);
  if (filter.til)            q = q.lte('published_at', filter.til);
  if (filter.søgning)        q = q.ilike('title', `%${filter.søgning}%`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapItem);
}

export async function hentRegulatoryItem(id: string): Promise<RegulatoryItem | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('regulatory_items').select('*').eq('id', id).single();
  return data ? mapItem(data as Record<string, unknown>) : null;
}

export async function hentItemHistorik(itemId: string): Promise<RegulatoryItemHistory[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('regulatory_item_history')
    .select('*')
    .eq('item_id', itemId)
    .order('changed_at', { ascending: false });
  return (data ?? []).map((r) => ({
    id:           r.id as string,
    itemId:       r.item_id as string,
    changedAt:    r.changed_at as string,
    changeReason: (r.change_reason as string) ?? null,
    snapshot:     r.snapshot as Record<string, unknown>,
  }));
}

export async function opdaterReviewStatus(id: string, status: ReviewStatus, note?: string) {
  const supabase = getSupabaseServerClient();
  const opdatering: Record<string, unknown> = { review_status: status };
  if (note !== undefined) opdatering.internal_note = note;
  await supabase.from('regulatory_items').update(opdatering).eq('id', id);
}

export async function hentOverblik(): Promise<RegelovervagningOverblik> {
  const alle = await hentRegulatoryItems();

  const sidst24t = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const nySidenSidsteImport = alle.filter((i) => i.firstSeenAt >= sidst24t).length;
  const højRelevans = alle.filter((i) => i.relevanceLevel === 'høj').length;

  const emneMap = new Map<RegulatoryTopic, number>();
  for (const item of alle) {
    for (const t of item.topics) {
      emneMap.set(t, (emneMap.get(t) ?? 0) + 1);
    }
  }
  const emneFordeling = Array.from(emneMap.entries())
    .map(([emne, antal]) => ({ emne, antal }))
    .sort((a, b) => b.antal - a.antal);

  const logs = await hentSenesteLog();
  const logRets = logs.find((l) => l.scraperId === 'retsinformation') ?? null;
  const logStps = logs.find((l) => l.scraperId === 'stps-nyheder') ?? null;

  return {
    nySidenSidsteImport,
    højRelevans,
    senesteRetsinformation: alle.filter((i) => i.source === 'retsinformation').slice(0, 5),
    senesteStps: alle.filter((i) => i.source === 'stps').slice(0, 5),
    emneFordeling,
    senesteImport: [
      { source: 'retsinformation', kørtKl: logRets?.kørtKl ?? null, ok: logRets?.ok ?? false },
      { source: 'stps',            kørtKl: logStps?.kørtKl ?? null, ok: logStps?.ok ?? false },
    ],
  };
}
