// src/features/regelovervagning/services/RelevansService/relevansService.ts

import type { RelevanceLevel, RegulatoryTopic } from '@/features/regelovervagning/types/regulatory.types';

type EmneRegel = { emne: RegulatoryTopic; keywords: string[] };

const EMNE_REGLER: EmneRegel[] = [
  { emne: 'medicinhåndtering',  keywords: ['medicin', 'lægemiddel', 'ordinering', 'dosering', 'dispensering', 'medicingivning'] },
  { emne: 'journalføring',      keywords: ['journal', 'journalføring', 'patientjournal', 'dokumentation', 'sundhedsfaglig dokumentation'] },
  { emne: 'delegation',         keywords: ['delegation', 'delegering', 'medhjælp', 'kompetence'] },
  { emne: 'instrukser',         keywords: ['instruks', 'instrukser', 'retningslinje', 'procedure'] },
  { emne: 'tilsyn',             keywords: ['tilsyn', 'tilsynsbesøg', 'socialtilsyn', 'styrelsen for patientsikkerhed'] },
  { emne: 'patientsikkerhed',   keywords: ['patientsikkerhed', 'utilsigtede hændelser', 'uth', 'obs-meddelelse', 'påbud'] },
  { emne: 'magtanvendelse',     keywords: ['magtanvendelse', 'tvang', 'fastholdelse'] },
  { emne: 'samtykke',           keywords: ['samtykke', 'informeret samtykke'] },
  { emne: 'serviceloven',       keywords: ['serviceloven', 'almenboligloven', 'botilbud', 'opholdssted', 'bosted', 'socialtilbud', 'soc', '§107', '§108'] },
];

const RELEVANTE_KEYWORDS = [
  'botilbud', 'bosted', 'opholdssted', 'socialtilbud', 'serviceloven', 'sundhedsloven',
  'autorisationsloven', 'medicinhåndtering', 'lægemidler', 'journalføring', 'patientjournal',
  'delegation', 'medhjælp', 'sundhedsfaglig dokumentation', 'instruks', 'patientsikkerhed',
  'magtanvendelse', 'samtykke', 'tilsyn', '§107', '§108',
];

const HØJ_RELEVANS_KEYWORDS = [
  'botilbud', 'bosted', 'opholdssted', 'patientsikkerhed', 'magtanvendelse',
  'medicinhåndtering', 'journalføring', 'delegation', 'instruks', 'påbud', 'uth',
];

export function vurderRelevans(tekst: string): {
  score: number;
  level: RelevanceLevel;
  topics: RegulatoryTopic[];
  recommendedAction: string | null;
} {
  const norm = tekst.toLowerCase();
  let score = 0;
  const topics: RegulatoryTopic[] = [];

  for (const kw of RELEVANTE_KEYWORDS) {
    if (norm.includes(kw)) score += 10;
  }

  for (const regel of EMNE_REGLER) {
    if (regel.keywords.some((kw) => norm.includes(kw))) {
      topics.push(regel.emne);
    }
  }

  const harHøjKw = HØJ_RELEVANS_KEYWORDS.some((kw) => norm.includes(kw));
  if (harHøjKw) score += 20;
  score = Math.min(score, 100);

  const level: RelevanceLevel = score >= 40 ? 'høj' : score >= 15 ? 'middel' : 'lav';

  const topics2 = topics.length > 0 ? topics : (['øvrige'] as RegulatoryTopic[]);

  let recommendedAction: string | null = null;
  if (level === 'høj') {
    recommendedAction = 'Faglig gennemgang anbefales — kan påvirke instrukser eller dokumentationspraksis på bosteder.';
  } else if (level === 'middel') {
    recommendedAction = 'Gennemgå og vurder relevans for eksisterende kunder.';
  }

  return { score, level, topics: topics2, recommendedAction };
}
