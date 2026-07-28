// src/lib/api/RegnskabClient/regnskabClient.ts
// Henter årsregnskab fra regnskab.virk.dk (offentlig API, ingen credentials).

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

const FELT_NAVNE: Record<string, keyof Pick<RegnskabOpslag, 'nettoomsaetning' | 'bruttofortjeneste' | 'aarsresultat' | 'egenkapital' | 'balance'>> = {
  'fsa:GrossProfit':      'bruttofortjeneste',
  'fsa:Revenue':          'nettoomsaetning',
  'ifrs-full:Revenue':    'nettoomsaetning',
  'fsa:ProfitLoss':       'aarsresultat',
  'ifrs-full:ProfitLoss': 'aarsresultat',
  'fsa:Equity':           'egenkapital',
  'ifrs-full:Equity':     'egenkapital',
  'fsa:Assets':           'balance',
  'ifrs-full:Assets':     'balance',
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
  const url = `https://regnskab.virk.dk/regnskab/xbrl/api/1/regnskab?cvrnummer=${cvr}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk' },
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`regnskab.virk.dk HTTP ${res.status}`);

  const liste = await res.json();
  if (!Array.isArray(liste) || liste.length === 0) return null;

  const seneste = liste.sort((a: { regnskabsperiode?: { slutDato?: string }; indsendelsesDato?: string }, b: { regnskabsperiode?: { slutDato?: string }; indsendelsesDato?: string }) => {
    const da = a.regnskabsperiode?.slutDato ?? a.indsendelsesDato ?? '';
    const db = b.regnskabsperiode?.slutDato ?? b.indsendelsesDato ?? '';
    return db.localeCompare(da);
  })[0];

  const xbrlFelter = parseXbrl(seneste.xbrlData ?? []);
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
