import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { parsePdfFraUrl } from '@/features/stps/scraper/StpsPdfParser';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

function venteMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function kørFundItemsScraper(batch = 30): Promise<Record<string, unknown>> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, pdf_url')
    .is('fund_items', null)
    .not('pdf_url', 'is', null)
    .limit(batch);

  if (error) throw new Error(error.message);

  const rapporter = data ?? [];
  let fundet = 0;
  let ingenItems = 0;
  let fejl = 0;

  for (let i = 0; i < rapporter.length; i++) {
    const { id, pdf_url } = rapporter[i];
    try {
      const detaljer = await parsePdfFraUrl(pdf_url!);
      if (detaljer.fundItems.length > 0) {
        await supabase.from('stps_rapporter').update({ fund_items: detaljer.fundItems }).eq('id', id);
        fundet++;
      } else {
        await supabase.from('stps_rapporter').update({ fund_items: [] }).eq('id', id);
        ingenItems++;
      }
    } catch {
      fejl++;
    }
    if (i < rapporter.length - 1) await venteMs(400);
  }

  const svar = { ok: true, behandlet: rapporter.length, fundet, ingenItems, fejl };
  await logScraperKørsel('stps-fund-items', true, svar);
  return svar;
}
