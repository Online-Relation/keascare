// src/features/stps/scraper/StpsPdfParser/stpsPdfParser.ts

import axios from 'axios';
import {
  STPS_HTTP_CONFIG,
  MAX_PDF_BYTES,
  MAX_RAA_TEKST_LAENGDE,
} from '@/features/stps/constants/StpsConstants';

export type PdfParseResultat = {
  raaText: string | null;
  sider: number | null;
};

export async function downloadOgParserPdf(pdfUrl: string): Promise<PdfParseResultat> {
  try {
    const response = await axios.get<ArrayBuffer>(pdfUrl, {
      ...STPS_HTTP_CONFIG,
      responseType: 'arraybuffer',
      maxContentLength: MAX_PDF_BYTES,
      timeout: 30_000,
    });

    const buffer = Buffer.from(response.data);

    // Dynamisk import undgår bundling-problemer med pdf-parse i Next.js
    // pdf-parse er et CommonJS-modul uden default export
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const resultat = await pdfParse(buffer);

    return {
      raaText: (resultat.text ?? '').substring(0, MAX_RAA_TEKST_LAENGDE) || null,
      sider: resultat.numpages ?? null,
    };
  } catch {
    // PDF-fejl er ikke fatale – vi gemmer URL'en og fortsætter uden tekst
    return { raaText: null, sider: null };
  }
}
