// types.ts — RapporterListeSektion interne typer

export type FilterState = {
  kommuner: string[];
  paragraffer: string[];
  los: string[];       // 'ja' | 'nej'
  stpsRapport: string[]; // 'ja' | 'nej'
  stpsFund: string[];  // fund niveau
};

export const TOMT_FILTER: FilterState = {
  kommuner: [],
  paragraffer: [],
  los: [],
  stpsRapport: [],
  stpsFund: [],
};

export type SubPanel = null | 'kommune' | 'paragraf' | 'los' | 'stps-rapport' | 'stps-fund';

export type SortValg = 'nyeste' | 'aeldste' | 'navn' | 'fund';

export const FUND_CFG: Record<string, { label: string; kortLabel: string; cls: string }> = {
  kritisk: { label: 'Kritiske fund', kortLabel: 'Kritisk', cls: 'badge-kritisk' },
  stoerre: { label: 'Større fund',   kortLabel: 'Større',  cls: 'badge-stoerre' },
  mindre:  { label: 'Mindre fund',   kortLabel: 'Mindre',  cls: 'badge-mindre'  },
  ingen:   { label: 'Ingen fund',    kortLabel: 'Ingen',   cls: 'badge-ingen'   },
  ukendt:  { label: 'Ukendt',        kortLabel: 'Ukendt',  cls: 'badge-ukendt'  },
};
