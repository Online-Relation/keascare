// Håndterer indgående Monday webhooks og synkroniserer ændrede items til Supabase.

import { mondayQuery } from '@/lib/api/MondayClient';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

type Kolonne = { id: string; text: string | null; type: string; column: { title: string } };
type RåItem = { id: string; name: string; group: { id: string; title: string }; column_values: Kolonne[] };
type ItemResponse = { items: RåItem[] };

function findKolonne(item: RåItem, titel: string): string | null {
  return item.column_values.find((cv) => cv.column.title.toLowerCase().includes(titel.toLowerCase()))?.text ?? null;
}

function mapGruppe(gruppeNavn: string): string {
  const norm = gruppeNavn.toLowerCase();
  if (norm.includes('nye')) return 'nye_forloeb';
  if (norm.includes('aktive')) return 'aktive_forloeb';
  if (norm.includes('afsluttede') || norm.includes('tabte')) return 'afsluttet_forloeb';
  return 'ukendt';
}

async function hentMondayItem(itemId: string): Promise<RåItem | null> {
  const data = await mondayQuery<ItemResponse>(`
    query ($itemId: ID!) {
      items(ids: [$itemId]) {
        id name
        group { id title }
        column_values { id text type column { title } }
      }
    }
  `, { itemId });

  return data.items[0] ?? null;
}

export async function syncMondayItem(itemId: string): Promise<void> {
  const item = await hentMondayItem(itemId);
  if (!item) return;

  // Ignorer items der ikke er bosteder
  const type = findKolonne(item, 'Type')?.toLowerCase();
  if (type && type !== 'bosted') return;

  const supabase = getSupabaseServerClient();

  const række = {
    monday_id:          item.id,
    navn:               item.name,
    gruppe:             mapGruppe(item.group.title),
    gruppe_navn:        item.group.title,
    adresse:            findKolonne(item, 'Forløb Adresse'),
    email:              findKolonne(item, 'Kontakt Mail'),
    website:            findKolonne(item, 'Forløb Website'),
    oprettet_dato:      findKolonne(item, 'Oprettelsesdato') || null,
    forloebsansvarlig:  findKolonne(item, 'Forløbsansvarlig') || null,
    opfoelgningsdato:   findKolonne(item, 'Opfølgningsdato') || null,
    afsluttet_dato:     findKolonne(item, 'Last updated') || null,
    status:             findKolonne(item, 'Status'),
    synkroniseret_kl:   new Date().toISOString(),
  };

  await supabase.from('monday_kunder').upsert(række, { onConflict: 'monday_id' });
}

export async function sletMondayItem(itemId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.from('monday_kunder').delete().eq('monday_id', itemId);
}
