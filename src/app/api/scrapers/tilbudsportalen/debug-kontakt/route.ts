// src/app/api/scrapers/tilbudsportalen/debug-kontakt/route.ts
// GET /api/scrapers/tilbudsportalen/debug-kontakt?navn=NyBakkely
// Diagnosticerer hvorfor et bosted mangler TP-kontaktdata: kø-efterslæb
// eller en reel parsing-fejl på selve siden.

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { TP_BROWSER_HEADERS } from '@/features/tilbudsportalen/constants/TilbudsportalenConstants';

export async function GET(req: NextRequest) {
  const navn = req.nextUrl.searchParams.get('navn');
  if (!navn) return NextResponse.json({ fejl: 'Giv ?navn=<del af bostedets navn>' }, { status: 400 });

  const supabase = getSupabaseServerClient();

  const { count: køStørrelse } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('id', { count: 'exact', head: true })
    .eq('detaljer_hentet', false);

  const { data: rækker } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('id, tilbudsid, afdelingsid, navn, tilbudsportalen_url, detaljer_hentet, kontaktperson, telefon, email, scraper_dato, tp_opdateret')
    .ilike('navn', `%${navn}%`);

  if (!rækker || rækker.length === 0) {
    return NextResponse.json({
      fundet: false,
      besked: `Intet bosted med navn matchende "${navn}" i tilbudsportalen_tilbud — er det slet ikke fundet af liste-scraperen endnu?`,
      køStørrelse,
    });
  }

  const resultater = [];
  for (const r of rækker) {
    let liveKontrol: Record<string, unknown> | null = null;

    if (r.tilbudsportalen_url) {
      try {
        const res = await axios.get<string>(r.tilbudsportalen_url, {
          timeout: 20_000,
          headers: TP_BROWSER_HEADERS,
        });
        const $ = load(res.data);
        const bodyTekst = $('body').text();

        // Samme udtræk som selve scraperen, til sammenligning
        let email: string | null = null;
        $('a[href^="mailto:"]').each((_, el) => { if (!email) email = $(el).attr('href')?.replace('mailto:', '').trim() ?? null; });
        if (!email) {
          const m = bodyTekst.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (m) email = m[0];
        }
        let telefon: string | null = null;
        const telMatch = bodyTekst.match(/(?:Telefon|Tlf\.?)[:\s]*([0-9\s]{8,11})/i);
        if (telMatch) telefon = telMatch[1].replace(/\s/g, '').substring(0, 8) || null;

        let kontaktpersonRå = '';
        $('*').each((_, el) => {
          if ($(el).text().trim() === 'Kontaktperson') {
            kontaktpersonRå = $(el).next().text().trim() || $(el).parent().next().text().trim();
            return false;
          }
        });

        liveKontrol = {
          statusKode: res.status,
          sideLængde: res.data.length,
          fundetEmailLive: email,
          fundetTelefonLive: telefon,
          kontaktpersonRåTekst: kontaktpersonRå,
          kontaktpersonRåLængde: kontaktpersonRå.length,
          kontaktpersonVilleBlivenNul: kontaktpersonRå.length > 60,
        };
      } catch (err) {
        liveKontrol = { hentFejl: err instanceof Error ? err.message : String(err) };
      }
    }

    resultater.push({
      id: r.id,
      navn: r.navn,
      url: r.tilbudsportalen_url,
      detaljerHentet: r.detaljer_hentet,
      gemtKontaktperson: r.kontaktperson,
      gemtTelefon: r.telefon,
      gemtEmail: r.email,
      scraperDato: r.scraper_dato,
      tpOpdateret: r.tp_opdateret,
      liveKontrol,
    });
  }

  return NextResponse.json({ fundet: true, køStørrelse, resultater });
}
