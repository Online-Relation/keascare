// src/features/stps/scraper/StpsScraper/stpsScraper.ts

import type { StpsScraperOptions, StpsScraperResultat } from '@/features/stps/types/stps.types';
import { scraperListeSider } from '@/features/stps/scraper/StpsListScraper';
import {
  mapSanktionerTilFundNiveau,
  udtraekSanktioner,
  udtraekFokusOmraader,
  udtraekKommune,
  udtraekRegion,
  udtraekTilsynsform,
  udtraekTemaer,
} from '@/features/stps/mappers/StpsFundMapper';
import {
  upsertStpsRapport,
  opretScraperLog,
  afslutScraperLog,
} from '@/features/stps/repository/StpsRepository';

export async function kørStpsScraper(
  options: StpsScraperOptions = {}
): Promise<StpsScraperResultat> {
  const { maxSider = 5 } = options;

  const logId = await opretScraperLog('stps');
  const fejl: string[] = [];
  let nye = 0;

  try {
    // Trin 1: Hent listesider — tags fra API indeholder alle nødvendige felter
    const listeItems = await scraperListeSider(maxSider);

    // Trin 2: Gem direkte fra listedata (detail-sider undgås for hastighed)
    for (const item of listeItems) {
      try {
        const sanktioner = udtraekSanktioner(item.tags);

        const gemt = await upsertStpsRapport({
          stps_tilbud_navn: item.navn,
          rapport_titel:    item.navn,
          rapport_dato:     item.rapportDato || null,
          rapport_url:      item.detailUrl,
          pdf_url:          null,
          stps_konklusion:  sanktioner.join(', ') || null,
          fund_niveau:      mapSanktionerTilFundNiveau(item.tags),
          fokus_omraader:   udtraekFokusOmraader(item.tags),
          raa_tekst:        null,
          kommune:          udtraekKommune(item.tags),
          region:           udtraekRegion(item.tags),
          tilsynsform:      udtraekTilsynsform(item.tags),
          temaer:           udtraekTemaer(item.tags),
        });

        if (gemt) nye++;
      } catch (err) {
        fejl.push(`${item.navn}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (logId) {
      await afslutScraperLog(logId, 'succes', listeItems.length, nye);
    }

    return { fundet: listeItems.length, nye, fejl };
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);

    if (logId) {
      await afslutScraperLog(logId, 'fejl', 0, 0, besked);
    }

    throw err;
  }
}
