// src/features/stps/scraper/StpsPdfParser/stpsPdfParser.ts

export type PdfDetaljer = {
  pdfUrl: string;
  vurdering: string | null;
  fund: string | null;
  cvr: string | null;
  adresse: string | null;
  pladser: string | null;
  pNummer: string | null;
};

export async function parsePdfFraUrl(pdfUrl: string): Promise<PdfDetaljer> {
  const tom: PdfDetaljer = { pdfUrl, vurdering: null, fund: null, cvr: null, adresse: null, pladser: null, pNummer: null };
  try {
    // pdf-parse v2 API: URL-based, works in Node.js
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ url: pdfUrl });
    const resultat = await parser.getText();
    const tekst: string = resultat.text ?? '';

    return {
      pdfUrl,
      vurdering: udtraekVurdering(tekst),
      fund: udtraekFund(tekst),
      cvr: udtraekCvr(tekst),
      adresse: udtraekAdresse(tekst),
      pladser: udtraekPladser(tekst),
      pNummer: udtraekPNummer(tekst),
    };
  } catch {
    return tom;
  }
}

function udtraekVurdering(tekst: string): string | null {
  const start = tekst.indexOf('Samlet vurdering efter tilsyn');
  if (start === -1) return null;

  const muligeSlut = [
    tekst.indexOf('Vi afslutter tilsynet', start),
    tekst.indexOf('2. Fund ved tilsynet', start),
    tekst.indexOf('Fund ved tilsynsbesøget', start),
  ].filter((i) => i > start);

  const slut = muligeSlut.length > 0 ? Math.min(...muligeSlut) : -1;
  if (slut === -1) return tekst.substring(start, start + 2000).trim();

  return tekst.substring(start, slut).trim();
}

function udtraekFund(tekst: string): string | null {
  const muligStart = [
    tekst.indexOf('2. Fund ved tilsynet'),
    tekst.indexOf('Fund ved tilsynsbesøget'),
    tekst.indexOf('2. Henstillinger'),
    tekst.indexOf('Henstillinger\n'),
  ].find((i) => i !== -1);
  if (muligStart === undefined) return null;

  const muligSlut = [
    tekst.indexOf('3. Baggrundsoplysninger', muligStart),
    tekst.indexOf('Baggrundsoplysninger\n', muligStart),
  ].find((i) => i > muligStart);

  const afsnit = muligSlut !== undefined
    ? tekst.substring(muligStart, muligSlut)
    : tekst.substring(muligStart, muligStart + 3000);

  return afsnit.trim() || null;
}

function udtraekCvr(tekst: string): string | null {
  const match = tekst.match(/CVR-?\s*nummer:\s*(\d{8})/i);
  return match?.[1] ?? null;
}

function udtraekAdresse(tekst: string): string | null {
  // Adressen sidder typisk som 2-3 linjer inden CVR-nummer på side 1
  const cvrIdx = tekst.search(/CVR-?\s*nummer:/i);
  if (cvrIdx === -1) return null;

  const foerCvr = tekst.substring(0, cvrIdx);
  const linjer = foerCvr.split('\n').map((l) => l.trim()).filter(Boolean);

  // Find gadenavn: linje der matcher "Vejnavn 123" mønster
  const vejRegex = /^[A-Za-zÆØÅæøå\s\-]+\s+\d+[A-Za-z]?,?\s*$/;
  const postnrRegex = /^\d{4}\s+[A-Za-zÆØÅæøå\s]+$/;

  let gade: string | null = null;
  let by: string | null = null;

  for (let i = linjer.length - 1; i >= 0; i--) {
    if (!by && postnrRegex.test(linjer[i])) { by = linjer[i]; continue; }
    if (!gade && vejRegex.test(linjer[i])) { gade = linjer[i]; break; }
  }

  if (gade && by) return `${gade.trim()}, ${by.trim()}`;
  if (gade) return gade.trim();
  return null;
}

function udtraekPNummer(tekst: string): string | null {
  const match =
    tekst.match(/P-?\s*nummer:?\s*(\d{10})/i) ??
    tekst.match(/Produktionsenhed:?\s*(\d{10})/i) ??
    tekst.match(/P\.?nr\.?:?\s*(\d{10})/i);
  return match?.[1] ?? null;
}

function udtraekPladser(tekst: string): string | null {
  const match =
    tekst.match(/plads til (\d+) borgere/i) ??
    tekst.match(/(\d+) pladser\b/i) ??
    tekst.match(/kapacitet(?:en)? (?:er )?(?:på )?(\d+)/i);
  return match?.[1] ?? null;
}
