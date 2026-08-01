import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { KundeDetailPage } from '@/features/monday/components/KundeDetailPage';
import { hentKundePakker } from '@/features/monday/services/MondayProdukterService';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ mondayId: string }> };

export default async function KundeDetailRoute({ params }: PageProps) {
  const { mondayId } = await params;
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('monday_kunder')
    .select('*')
    .eq('monday_id', mondayId)
    .single();

  if (!data) notFound();

  const pakker = await hentKundePakker(data.monday_id).catch(() => []);

  return (
    <KundeDetailPage
      mondayId={data.monday_id}
      navn={data.navn ?? ''}
      gruppeNavn={data.gruppe_navn ?? ''}
      forloebsansvarlig={data.forloebsansvarlig}
      oprettetDato={data.oprettet_dato}
      status={data.status}
      adresse={data.adresse || null}
      pakker={pakker}
    />
  );
}
