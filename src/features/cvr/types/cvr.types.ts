export type CvrSignal = {
  id: string;
  cvr: string;
  navn: string;
  kommune: string | null;
  adresse: string | null;
  branchekode: string;
  branchetekst: string;
  startdato: string | null;
  opdagetDato: string;
  mondayItemId: string | null;
};

// Branchekoder der indikerer botilbud
export const BOSTED_BRANCHEKODER: Record<string, string> = {
  '87901': 'Botilbud til personer med særlige sociale problemer',
  '87902': 'Botilbud til personer med handicap eller sindslidelse',
};
