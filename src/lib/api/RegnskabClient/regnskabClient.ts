// src/lib/api/RegnskabClient/regnskabClient.ts
// Henter årsregnskab fra Erhvervsstyrelsens CVR distribution API.
// Kræver CVR_USER + CVR_PASS env-vars (system-til-system adgang fra distribution.virk.dk).

export type RegnskabOpslag = {
  cvr: string;
  regnskabsaar: number | null;
  periodeStart: string | null;
  periodeSlut: string | null;
  nettoomsaetning: number | null;
  bruttofortjeneste: number | null;
  aarsresultat: number | null;
  egenkapital: number | null;
  balance: number | null;
  valuta: string | null;
  indsendt: string | null;
};

type RegnskabHit = {
  cvrNummer?: number;
  regnskabsperiode?: {
    startDato?: string;
    slutDato?: string;
  };
  indsendelsesDato?: string;
  sagsNummer?: string;
  xbrl?: {
    xbrlData?: Array<{
      name?: string;
      value?: string | number;
    }>;
  };
};

const FELT_NAVNE: Record<string, keyof Pick<RegnskabOpslag, 'nettoomsaetning' | 'bruttofortjeneste' | 'aarsresultat' | 'egenkapital' | 'balance'>> = {
  'fsa:GrossProfit':     'bruttofortjeneste',
  'fsa:Revenue':         'nettoomsaetning',
  'ifrs-full:Revenue':   'nettoomsaetning',
  'fsa:ProfitLoss':      'aarsresultat',
  'ifrs-full:ProfitLoss':'aarsresultat',
  'fsa:Equity':          'egenkapital',
  'ifrs-full:Equity':    'egenkapital',
  'fsa:Assets':          'balance',
  'ifrs-full:Assets':    'balance',
};

function parseXbrl(felter: Array<{ name?: string; value?: string | number }>): Partial<RegnskabOpslag> {
  const resultat: Partial<RegnskabOpslag> = {};
  for (const felt of felter) {
    const nøgle = felt.name;
    if (!nøgle) continue;
    const mål = FELT_NAVNE[nøgle];
    if (!mål) continue;
    const v = typeof felt.value === 'number' ? felt.value : parseFloat(String(felt.value ?? ''));
    if (!isNaN(v) && resultat[mål] === undefined) {
      (resultat as Record<string, number>)[mål] = v;
    }
  }
  return resultat;
}

export async function hentRegnskab(cvr: string): Promise<RegnskabOpslag | null> {
  const user = process.env.CVR_USER;
  const pass = process.env.CVR_PASS;
  if (!user || !pass) throw new Error('CVR_USER og CVR_PASS skal sættes som env-vars');

  const auth = Buffer.from(`${user}:${pass}`).toString('base64');

  const body = {
    query: { term: { 'cvrNummer': parseInt(cvr, 10) } },
    sort: [{ 'regnskabsperiode.slutDato': { order: 'desc' } }],
    size: 5,
  };

  const res = await fetch('http://distribution.virk.dk/cvr-permanent/regnskab/_search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`distribution.virk.dk HTTP ${res.status}`);

  const json = await res.json();
  const hits: RegnskabHit[] = json?.hits?.hits?.map((h: { _source: RegnskabHit }) => h._source) ?? [];

  if (hits.length === 0) return null;

  // Seneste regnskab først
  const seneste = hits.sort((a, b) => {
    const da = a.regnskabsperiode?.slutDato ?? a.indsendelsesDato ?? '';
    const db = b.regnskabsperiode?.slutDato ?? b.indsendelsesDato ?? '';
    return db.localeCompare(da);
  })[0];

  const xbrlFelter = parseXbrl(seneste.xbrl?.xbrlData ?? []);
  const slutDato = seneste.regnskabsperiode?.slutDato ?? null;
  const aar = slutDato ? new Date(slutDato).getFullYear() : null;

  return {
    cvr,
    regnskabsaar: aar,
    periodeStart: seneste.regnskabsperiode?.startDato ?? null,
    periodeSlut: slutDato,
    indsendt: seneste.indsendelsesDato ?? null,
    valuta: 'DKK',
    nettoomsaetning: xbrlFelter.nettoomsaetning ?? null,
    bruttofortjeneste: xbrlFelter.bruttofortjeneste ?? null,
    aarsresultat: xbrlFelter.aarsresultat ?? null,
    egenkapital: xbrlFelter.egenkapital ?? null,
    balance: xbrlFelter.balance ?? null,
  };
}
