// src/features/stps/scraper/StpsPdfParser/stpsPdfParser.ts

export type FundStatus = 'opfyldt' | 'ikke_opfyldt' | 'ikke_aktuelt' | 'ukendt';

export type FundItem = {
  sektion: string;
  nummer: number;
  målepunkt: string;
  status: FundStatus;
  kommentar: string | null;
};

export type PdfDetaljer = {
  pdfUrl: string;
  vurdering: string | null;
  fund: string | null;
  cvr: string | null;
  adresse: string | null;
  pladser: string | null;
  pNummer: string | null;
  fundItems: FundItem[];
};

export async function parsePdfFraUrl(pdfUrl: string): Promise<PdfDetaljer> {
  const tom: PdfDetaljer = { pdfUrl, vurdering: null, fund: null, cvr: null, adresse: null, pladser: null, pNummer: null, fundItems: [] };
  try {
    // Fetch PDF manuelt med browser-headers — STPS blokerer plain Node.js fetch
    const res = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*',
        'Accept-Language': 'da-DK,da;q=0.9,en;q=0.8',
        'Referer': 'https://stps.dk/',
      },
    });
    if (!res.ok) return tom;
    const data = new Uint8Array(await res.arrayBuffer());

    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data });
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
      fundItems: udtraekFundItems(tekst),
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

function udtraekFundItems(tekst: string): FundItem[] {
  // Find fund-sektionen
  const fundStart = tekst.search(/\b2\.\s*Fund ved tilsynet\b/i);
  if (fundStart === -1) return [];

  const efter = tekst.substring(fundStart);
  const fundSlut = efter.search(/\n3\.\s+Baggrundsoplysninger/i);
  const fundTekst = fundSlut !== -1 ? efter.substring(0, fundSlut) : efter;

  // Fjern støj: tabelhoveder og sidetal
  const renset = fundTekst
    .replace(/2\.\s*Fund ved tilsynet\s*/gi, '')
    .replace(/Num\s*\n?\s*mer\s+Målepunkt\s+Opfyldt\s+Ikke\s*\n?\s*opfyldt\s+Ikke\s*\n?\s*aktuelt\s+Fund og kommentarer\s*/gi, '')
    .replace(/Nummer\s+Målepunkt\s+Opfyldt\s+Ikke opfyldt\s+Ikke aktuelt\s+Fund og kommentarer\s*/gi, '')
    .replace(/Tilsynsrapport[\s\S]{0,80}?Side \d+ af \d+\s*/g, '')
    .replace(/--\s*\d+\s*(?:of|af)\s*\d+\s*--/gi, '')
    .replace(/\n{3,}/g, '\n')
    .trim();

  const linjer = renset.split('\n').map((l) => l.trim()).filter(Boolean);

  const items: FundItem[] = [];
  let aktivSektion = 'Fund ved tilsynet';
  let aktivNummer = 0;
  let målepunktLinjer: string[] = [];
  let kommentarLinjer: string[] = [];
  let harX = false;
  let efterX = false;

  const TABEL_STØJ = /^(Opfyldt|Ikke opfyldt|Ikke aktuelt|Fund og kommentarer|Num|mer|Nummer|Målepunkt)$/i;

  function gemItem() {
    if (aktivNummer === 0 || målepunktLinjer.length === 0) return;
    const målepunkt = målepunktLinjer.join(' ').replace(/\s+/g, ' ').trim();
    const kommentar = kommentarLinjer.join(' ').replace(/\s+/g, ' ').trim() || null;
    let status: FundStatus;
    if (!harX) status = 'ikke_aktuelt';
    else if (kommentar) status = 'ikke_opfyldt';
    else status = 'opfyldt';
    items.push({ sektion: aktivSektion, nummer: aktivNummer, målepunkt, status, kommentar });
    aktivNummer = 0;
    målepunktLinjer = [];
    kommentarLinjer = [];
    harX = false;
    efterX = false;
  }

  for (const linje of linjer) {
    if (TABEL_STØJ.test(linje)) continue;

    const nummerMatch = linje.match(/^(\d+)\.\s+(.+)/);
    const erX = linje === 'X';

    if (nummerMatch) {
      gemItem();
      aktivNummer = parseInt(nummerMatch[1]);
      målepunktLinjer = [nummerMatch[2]];
      efterX = false;
    } else if (erX && aktivNummer > 0) {
      harX = true;
      efterX = true;
    } else if (aktivNummer > 0 && efterX) {
      kommentarLinjer.push(linje);
    } else if (aktivNummer > 0 && !efterX) {
      målepunktLinjer.push(linje);
    } else if (!nummerMatch && linje.length > 5) {
      // Sektionsoverskrift
      gemItem();
      aktivSektion = linje;
    }
  }

  gemItem();
  return items;
}

function udtraekPladser(tekst: string): string | null {
  const match =
    tekst.match(/plads til (\d+) borgere/i) ??
    tekst.match(/(\d+) pladser\b/i) ??
    tekst.match(/kapacitet(?:en)? (?:er )?(?:på )?(\d+)/i);
  return match?.[1] ?? null;
}
