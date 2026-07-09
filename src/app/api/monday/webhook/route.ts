// Modtager webhooks fra Monday.com og synkroniserer ændringer til Supabase.
// Monday kræver at vi svarer 200 OK hurtigt — tung logik kører i baggrunden.

import { NextRequest, NextResponse } from 'next/server';
import { syncMondayItem, sletMondayItem } from '@/features/monday/services/MondayWebhookService';

// Monday sender en challenge ved oprettelse af webhook — vi skal ekkoere den tilbage.
type WebhookBody = {
  challenge?: string;
  event?: {
    type: string;
    pulseId?: number;   // item id (Monday kalder items "pulses")
    itemId?: number;
  };
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Valider hemmelighed via query-param (?secret=...)
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.MONDAY_WEBHOOK_SECRET) {
    return NextResponse.json({ fejl: 'Uautoriseret' }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fejl: 'Ugyldig JSON' }, { status: 400 });
  }

  // Monday challenge-håndshake ved webhook-oprettelse
  if (body.challenge) {
    return NextResponse.json({ challenge: body.challenge });
  }

  const event = body.event;
  if (!event) return NextResponse.json({ ok: true });

  const itemId = String(event.pulseId ?? event.itemId ?? '');
  if (!itemId) return NextResponse.json({ ok: true });

  const eventType = event.type ?? '';

  // Kør synkronisering i baggrunden — svar Monday hurtigt
  if (eventType === 'delete_pulse') {
    // Item slettet i Monday → fjern fra Supabase
    sletMondayItem(itemId).catch(console.error);
  } else {
    // Alt andet (create, update, move) → hent og upsert item
    syncMondayItem(itemId).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
