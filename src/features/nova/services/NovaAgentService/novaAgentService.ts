// src/features/nova/services/NovaAgentService/novaAgentService.ts
//
// Nova er en autonom baggrunds-agent der kører efter den daglige cron.
// Hun finder huller i data og matcher ting op på kryds og tværs —
// uden at rapportere noget til UI. Hun arbejder bare.
//
// Pipeline:
//   1. STPS × P-nummer → CVR      (rapporter med p_nummer men uden cvr)
//   2. STPS × CVR → TP            (rapporter med cvr men uden tilbudsportal-data)
//   3. STPS × CVR → LOS           (sæt los_membre flag korrekt)
//   4. STPS × CVR → Monday        (opdater monday_kunde flag)
//   5. TP re-queue                 (sæt detaljer_hentet=false på TP-records >30 dage gamle)

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { slaaPNummerOp } from '@/lib/api/CvrClient';
import { matchLosTilBosted } from '@/features/los/repository/LosRepository';

function venteMs(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// 1. Find rapporter med p_nummer men uden cvr — slå op og gem
async function matchPNummerTilCvr(supabase: ReturnType<typeof getSupabaseServerClient>, batch: number) {
  const { data } = await supabase
    .from('stps_rapporter')
    .select('id, p_nummer, tp_p_nummer')
    .is('cvr', null)
    .or('p_nummer.not.is.null,tp_p_nummer.not.is.null')
    .limit(batch);

  const rækker = data ?? [];
  let matchet = 0;

  for (const r of rækker) {
    const pNummer = r.p_nummer ?? r.tp_p_nummer;
    if (!pNummer) continue;
    try {
      const opslag = await slaaPNummerOp(pNummer);
      if (opslag?.cvrNummer) {
        await supabase.from('stps_rapporter')
          .update({ cvr: opslag.cvrNummer, adresse: opslag.adresse ?? undefined })
          .eq('id', r.id);
        matchet++;
      }
      await venteMs(300);
    } catch { /* fortsæt */ }
  }

  return { behandlet: rækker.length, matchet };
}

// 2. Find rapporter med cvr men uden tilbudsportal-data — hent fra TP-tabellen
async function matchCvrTilTilbudsportalen(supabase: ReturnType<typeof getSupabaseServerClient>, batch: number) {
  const { data: stpsRækker } = await supabase
    .from('stps_rapporter')
    .select('id, cvr')
    .not('cvr', 'is', null)
    .is('tp_tilbudstype', null)
    .limit(batch);

  if (!stpsRækker || stpsRækker.length === 0) return { behandlet: 0, matchet: 0 };

  const cvrer = [...new Set(stpsRækker.map((r) => r.cvr as string))];

  const { data: tpRækker } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('cvr, tilbudstype, driftsform, kommune, pladser')
    .in('cvr', cvrer);

  if (!tpRækker || tpRækker.length === 0) return { behandlet: stpsRækker.length, matchet: 0 };

  const cvrMap = new Map<string, typeof tpRækker[0]>();
  for (const tp of tpRækker) {
    if (tp.cvr && !cvrMap.has(tp.cvr)) cvrMap.set(tp.cvr, tp);
  }

  let matchet = 0;
  for (const r of stpsRækker) {
    if (!r.cvr) continue;
    const tp = cvrMap.get(r.cvr);
    if (!tp) continue;

    await supabase.from('stps_rapporter').update({
      tp_tilbudstype: tp.tilbudstype ?? undefined,
      tp_driftsform:  tp.driftsform ?? undefined,
      kommune:        tp.kommune ?? undefined,
    }).eq('id', r.id);
    matchet++;
  }

  return { behandlet: stpsRækker.length, matchet };
}

// 3. Synkroniser los_membre flag baseret på los_membres.cvr
async function synkroniserLosFlag(): Promise<{ matchet: number }> {
  const matchet = await matchLosTilBosted();
  return { matchet };
}

// 4. Synkroniser monday_kunde flag baseret på monday_kunder.cvr
async function synkroniserMondayFlag(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { data: mondayKunder } = await supabase
    .from('monday_kunder')
    .select('cvr, monday_item_id, gruppe')
    .not('cvr', 'is', null);

  if (!mondayKunder || mondayKunder.length === 0) return { matchet: 0 };

  const aktiveCvr = new Set(
    mondayKunder
      .filter((k) => k.gruppe === 'nye_forloeb' || k.gruppe === 'aktive_forloeb')
      .map((k) => k.cvr as string)
  );

  if (aktiveCvr.size > 0) {
    await supabase.from('stps_rapporter')
      .update({ monday_kunde: true })
      .in('cvr', [...aktiveCvr]);
  }

  const alleCvr = mondayKunder.map((k) => k.cvr as string);
  const inaktiveCvr = alleCvr.filter((cvr) => !aktiveCvr.has(cvr));
  if (inaktiveCvr.length > 0) {
    await supabase.from('stps_rapporter')
      .update({ monday_kunde: false })
      .in('cvr', inaktiveCvr)
      .eq('monday_kunde', true);
  }

  return { matchet: aktiveCvr.size };
}

// 5. Re-queue TP-records der er mere end 30 dage gamle — scraperens næste kørsel opdaterer dem
// Vi sætter detaljer_hentet = false, så hentUbehandledeAfdelinger() plukker dem op igen.
// Maks 100 ad gangen for ikke at overbelaste scraperens kø med det samme.
async function reQueueGamleTP(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const trediveDageSiden = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Hent IDs på records der skal re-queues (limit 100 pr. kørsel)
  const { data } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('id')
    .lt('tp_opdateret', trediveDageSiden)
    .eq('detaljer_hentet', true)
    .limit(100);

  if (!data || data.length === 0) return { reQueued: 0 };

  const ids = data.map((r) => r.id);
  await supabase
    .from('tilbudsportalen_tilbud')
    .update({ detaljer_hentet: false })
    .in('id', ids);

  return { reQueued: ids.length };
}

// Hoved-funktion — Nova kører hele pipeline
export async function kørNovaAgent(batch = 50): Promise<Record<string, unknown>> {
  const supabase = getSupabaseServerClient();

  const [pTilCvr, cvrTilTp, losFlag, mondayFlag, tpReQueue] = await Promise.allSettled([
    matchPNummerTilCvr(supabase, batch),
    matchCvrTilTilbudsportalen(supabase, batch),
    synkroniserLosFlag(),
    synkroniserMondayFlag(supabase),
    reQueueGamleTP(supabase),
  ]);

  return {
    ok: true,
    pNummerTilCvr:       pTilCvr.status      === 'fulfilled' ? pTilCvr.value      : { fejl: String((pTilCvr as PromiseRejectedResult).reason) },
    cvrTilTilbudsportal: cvrTilTp.status     === 'fulfilled' ? cvrTilTp.value     : { fejl: String((cvrTilTp as PromiseRejectedResult).reason) },
    losFlag:             losFlag.status       === 'fulfilled' ? losFlag.value      : { fejl: String((losFlag as PromiseRejectedResult).reason) },
    mondayFlag:          mondayFlag.status    === 'fulfilled' ? mondayFlag.value   : { fejl: String((mondayFlag as PromiseRejectedResult).reason) },
    tpReQueue:           tpReQueue.status     === 'fulfilled' ? tpReQueue.value    : { fejl: String((tpReQueue as PromiseRejectedResult).reason) },
  };
}
