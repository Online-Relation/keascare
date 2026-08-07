// src/app/api/scrapers/tilbudsportalen/debug-kontakt/route.ts
// GET /api/scrapers/tilbudsportalen/debug-kontakt?navn=NyBakkely
// Diagnosticerer hvorfor et bosted mangler TP-kontaktdata: kø-efterslæb
// eller en reel parsing-fejl på selve siden.

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { TP_BROWSER_HEADERS } from '@/features/tilbudsportalen/constants/TilbudsportalenConstants';
import { normaliserNavn, fuzzyScore } from '@/features/tilbudsportalen/matcher/TilbudsportalenMatcher/tilbudsportalenMatcher';

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

  // Diagnosticér selve STPS↔TP-matchingen — bosted-siden læser tp_kontaktperson
  // m.fl. fra stps_rapporter, IKKE direkte fra tilbudsportalen_tilbud. Så selvom
  // TP-detaljerne er korrekt hentet ovenfor, kan de mangle på bosted-siden hvis
  // matcheren aldrig har koblet STPS-rapporten til denne TP-afdeling.
  const { data: stpsRækker } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, cvr, kommune, tp_kommune, tp_kontaktperson, tp_telefon, tp_email, tp_tilbudstype')
    .ilike('stps_tilbud_navn', `%${navn}%`);

  const matchDiagnose = (stpsRækker ?? []).map((s) => {
    const stpsNorm = normaliserNavn(s.stps_tilbud_navn ?? '');
    const kandidater = rækker.map((r) => {
      const tpNorm = normaliserNavn(r.navn ?? '');
      return {
        tpNavn: r.navn,
        tpNormaliseret: tpNorm,
        præfiksMatch: tpNorm.startsWith(stpsNorm) || stpsNorm.startsWith(tpNorm),
        fuzzyScore: Math.round(fuzzyScore(s.stps_tilbud_navn ?? '', r.navn ?? '') * 100) / 100,
      };
    });

    return {
      stpsId: s.id,
      stpsNavn: s.stps_tilbud_navn,
      stpsNormaliseret: stpsNorm,
      stpsCvr: s.cvr,
      stpsKommune: s.kommune,
      stpsTpKommune: s.tp_kommune,
      alleredeMatchet: !!(s.tp_kontaktperson || s.tp_telefon || s.tp_email || s.tp_tilbudstype),
      gemtTpKontaktperson: s.tp_kontaktperson,
      besked: !s.cvr
        ? 'STPS-rapporten mangler CVR endnu — CVR-match er eneste matchtype der ikke kræver kommune-match'
        : 'STPS-rapporten har CVR — tjek om det matcher TP-afdelingens CVR',
      kandidater,
    };
  });

  return NextResponse.json({ fundet: true, køStørrelse, resultater, matchDiagnose });
}
