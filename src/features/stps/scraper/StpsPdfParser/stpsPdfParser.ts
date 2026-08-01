// src/features/stps/scraper/StpsPdfParser/stpsPdfParser.ts

export type FundStatus = 'opfyldt' | 'ikke_opfyldt' | 'ikke_aktuelt' | 'ukendt';

export type FundItem = {
  sektion: string;
  nummer: number;
  målepunkt: string;
  status: FundStatus;
  kommentar: string | null;
};

export type TilsynDeltager = {
  navn: string;
  titel: string | null;
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
  deltagereStps: TilsynDeltager[];
  deltagereBosted: TilsynDeltager[];
};

export async function parsePdfFraUrl(pdfUrl: string): Promise<PdfDetaljer> {
  const tom: PdfDetaljer = { pdfUrl, vurdering: null, fund: null, cvr: null, adresse: null, pladser: null, pNummer: null, fundItems: [], deltagereStps: [], deltagereBosted: [] };
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
    const buf = Buffer.from(await res.arrayBuffer());

    // pdf-parse er CJS — brug createRequire for at undgå ESM-importproblemer
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
    const resultat = await pdfParse(buf);
    const tekst: string = resultat.text ?? '';

    const { stps, bosted } = udtraekDeltagere(tekst);
    return {
      pdfUrl,
      vurdering: udtraekVurdering(tekst),
      fund: udtraekFund(tekst),
      cvr: udtraekCvr(tekst),
      adresse: udtraekAdresse(tekst),
      pladser: udtraekPladser(tekst),
      pNummer: udtraekPNummer(tekst),
      fundItems: udtraekFundItems(tekst),
      deltagereStps: stps,
      deltagereBosted: bosted,
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

// Matcher et dansk personnavn: mindst ét fornavn + efternavn
// Tillader: bindestreg, punktum (initialer), store bogstaver, mellemnavne
const NAVN_REGEX = /^[A-ZÆØÅ][A-Za-zæøå\-\.]+(?:\s+[A-Za-zæøå\-\.]+){1,5}$/;

// For kort til at være et navn (under 4 tegn eller kun ét ord)
function erSandsynligtNavn(s: string): boolean {
  if (s.length < 4) return false;
  const ord = s.trim().split(/\s+/);
  if (ord.length < 2) return false; // kræver mindst to ord
  if (!NAVN_REGEX.test(s)) return false;
  // Undgå falske positiver: rene tal-strenge, kendte ikke-navne-ord
  if (/^(Side|Dato|Tilsyn|Rapport|Sted|Leder|Bosted|Navn|Titel)$/i.test(s)) return false;
  return true;
}

// Kendte titel-ord der indikerer en person uden navn opgivet
const TITEL_REGEX = /^[Ee]n\s+(sygeplejerske|oversygeplejerske|læge|leder|souschef|pædagog|social)/;

function parsDeltagereBlok(tekst: string, startIdx: number): TilsynDeltager[] {
  const efter = tekst.substring(startIdx);
  const slutIdx = efter.search(/\n(?:Tilsynet blev foretaget af|Ved tilsynet[\s\S]{0,10}deltog|Lovgrundlag|Baggrundsoplysninger|--\s*\d)/i);
  const blok = slutIdx !== -1 ? efter.substring(0, slutIdx) : efter.substring(0, 1500);

  const deltagere: TilsynDeltager[] = [];

  // Saml naboline hvis de danner ét navn (fornavn på én linje, efternavn på næste)
  const råLinjer = blok.split('\n').map((l) => l.trim()).filter(Boolean);
  const linjer: string[] = [];
  for (let i = 0; i < råLinjer.length; i++) {
    const cur = råLinjer[i];
    const næste = råLinjer[i + 1] ?? '';
    // Hvis nuværende linje er ét ord (fornavn) og næste er ét ord (efternavn), slå dem sammen
    if (
      /^[A-ZÆØÅ][a-zæøå\-]+$/.test(cur) &&
      /^[A-ZÆØÅ][a-zæøå\-]+(,.*)?$/.test(næste)
    ) {
      linjer.push(`${cur} ${næste}`);
      i++; // spring næste over
    } else {
      linjer.push(cur);
    }
  }

  for (const rawLinje of linjer) {
    // Strip bullet-tegn og lignende foran teksten
    const linje = rawLinje.replace(/^[\s•\-\*\–\—\·]+/, '').trim();
    if (!linje || linje.length < 3) continue;

    // Spring overskrifter og metadata over
    if (/^(Tilsynet blev foretaget af|Ved tilsynet|deltog:|afsluttende opsamling)/i.test(linje)) continue;
    if (/\d{2}[-\.]\d{2}[-\.]\d{4}/.test(linje)) continue; // datoer
    if (linje.includes('://') || linje.includes('@')) continue; // URLs, emails
    if (/^[A-Z]{2,}\s*\d/.test(linje)) continue; // sagsnumre som "STPS-2024-123"

    // Format 1: "Fornavn Efternavn, titel" — STPS-inspektørernes format
    const kommaIdx = linje.indexOf(',');
    if (kommaIdx !== -1 && kommaIdx > 3) {
      const muligNavn = linje.substring(0, kommaIdx).trim();
      const muligTitel = linje.substring(kommaIdx + 1).trim();
      if (erSandsynligtNavn(muligNavn)) {
        deltagere.push({ navn: muligNavn, titel: muligTitel || null });
        continue;
      }
    }

    // Format 2: "Titel Fornavn Efternavn" — bostedets format, f.eks. "Områdeleder Lais Wardag"
    // Kendte titel-præfikser der sidder foran et navn
    const titelPræfixMatch = linje.match(
      /^(Områdeleder|Leder|Souschef|Forstander|Centerleder|Afdelingsleder|Teamleder|Daglig leder|Stedfortræder|Sygeplejerske|Oversygeplejerske|Pædagog|Social- og sundhedsassistent|SOSU|SSA|SSH|Ergoterapeut|Fysioterapeut|Psykolog|Læge)\s+(.+)$/i
    );
    if (titelPræfixMatch) {
      const titel = titelPræfixMatch[1];
      const muligNavn = titelPræfixMatch[2].trim();
      if (erSandsynligtNavn(muligNavn)) {
        deltagere.push({ navn: muligNavn, titel });
        continue;
      }
    }

    // Format 3: Bart navn uden titel
    if (erSandsynligtNavn(linje)) {
      deltagere.push({ navn: linje, titel: null });
      continue;
    }

    // Format 4: "En sygeplejerske" o.l. — anonym deltager
    if (TITEL_REGEX.test(linje)) {
      deltagere.push({ navn: linje, titel: null });
    }
  }

  return deltagere;
}

function udtraekDeltagere(tekst: string): { stps: TilsynDeltager[]; bosted: TilsynDeltager[] } {
  // "Tilsynet blev foretaget af:" = STPS-inspektører
  const stpsIdx = tekst.search(/Tilsynet blev foretaget af/i);
  // "Ved tilsynet og den afsluttende opsamling deltog:" = bostedets personale
  const bostedIdx = tekst.search(/Ved tilsynet[\s\S]{0,20}deltog/i);

  const stps = stpsIdx !== -1 ? parsDeltagereBlok(tekst, stpsIdx) : [];
  const bosted = bostedIdx !== -1 ? parsDeltagereBlok(tekst, bostedIdx) : [];

  return { stps, bosted };
}

function udtraekPladser(tekst: string): string | null {
  const match =
    tekst.match(/plads til (\d+) borgere/i) ??
    tekst.match(/(\d+) pladser\b/i) ??
    tekst.match(/kapacitet(?:en)? (?:er )?(?:på )?(\d+)/i);
  return match?.[1] ?? null;
}
