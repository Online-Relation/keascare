// Beriger ét bosted med data fra tilbudsportalen_tilbud via CVR.
// Bruges som "Hent TP-data nu"-knap på bostedsiden.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function POST(req: NextRequest) {
  const { bostedId, cvr } = await req.json() as { bostedId: string; cvr: string };
  if (!bostedId || !cvr) {
    return NextResponse.json({ ok: false, fejl: 'bostedId og cvr kræves' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // Find bedste TP-match på CVR — vælg rækken med flest data
  const { data: tpRækker } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('tilbudstype, pladser, p_nummer, kommune, kontaktperson, telefon, email, tilbuddets_adresse, leder, website, virksomheds_navn, tilsynsmyndighed, pladser_pr_paragraf, driftsform')
    .eq('cvr', cvr)
    .eq('detaljer_hentet', true);

  if (!tpRækker?.length) {
    return NextResponse.json({ ok: false, fejl: `Ingen Tilbudsportalen-data fundet for CVR ${cvr}` });
  }

  // Vælg rækken med flest udfyldte felter
  const bedste = tpRækker.reduce((a, b) => {
    const score = (r: typeof a) => [r.tilbudstype, r.pladser, r.kommune, r.kontaktperson, r.telefon, r.email].filter(Boolean).length;
    return score(a) >= score(b) ? a : b;
  });

  const { error } = await supabase.from('stps_rapporter').update({
    tp_tilbudstype:      bedste.tilbudstype,
    tp_pladser:          bedste.pladser?.toString() ?? null,
    tp_p_nummer:         bedste.p_nummer,
    tp_kommune:          bedste.kommune,
    tp_kontaktperson:    bedste.kontaktperson,
    tp_telefon:          bedste.telefon,
    tp_email:            bedste.email,
    tp_adresse:          bedste.tilbuddets_adresse,
    tp_leder:            bedste.leder,
    tp_website:          bedste.website,
    tp_virksomheds_navn: bedste.virksomheds_navn,
    tp_tilsynsmyndighed: bedste.tilsynsmyndighed,
    tp_pladser_pr_paragraf: bedste.pladser_pr_paragraf,
    tp_driftsform:       bedste.driftsform,
  }).eq('id', bostedId);

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, afdelinger: tpRækker.length });
}
