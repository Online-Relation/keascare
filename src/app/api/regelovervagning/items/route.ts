import { NextRequest, NextResponse } from 'next/server';
import { hentRegulatoryItems } from '@/features/regelovervagning/services/RegulatoryItemService';
import type { RegulatoryFilter } from '@/features/regelovervagning/services/RegulatoryItemService';
import type { RegulatorySource, RelevanceLevel, ReviewStatus, RegulatoryTopic } from '@/features/regelovervagning/types/regulatory.types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const filter: RegulatoryFilter = {
    source:         (p.get('source') as RegulatorySource) || undefined,
    relevanceLevel: (p.get('relevanceLevel') as RelevanceLevel) || undefined,
    reviewStatus:   (p.get('reviewStatus') as ReviewStatus) || undefined,
    topic:          (p.get('topic') as RegulatoryTopic) || undefined,
    søgning:        p.get('søgning') || undefined,
    fra:            p.get('fra') || undefined,
    til:            p.get('til') || undefined,
  };
  try {
    const items = await hentRegulatoryItems(filter);
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return NextResponse.json({ ok: false, fejl: String(err) }, { status: 500 });
  }
}
