// src/features/regelovervagning/types/regulatory.types.ts

export type RegulatorySource = 'retsinformation' | 'stps';
export type RelevanceLevel = 'lav' | 'middel' | 'høj';
export type ReviewStatus = 'ny' | 'læst' | 'relevant' | 'ikke_relevant' | 'handling';

export type RegulatoryTopic =
  | 'medicinhåndtering'
  | 'journalføring'
  | 'delegation'
  | 'instrukser'
  | 'tilsyn'
  | 'patientsikkerhed'
  | 'magtanvendelse'
  | 'samtykke'
  | 'serviceloven'
  | 'øvrige';

export type RegulatoryItem = {
  id: string;
  source: RegulatorySource;
  externalId: string;
  sourceType: string | null;
  title: string;
  summary: string | null;
  bodyText: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  changedAtSource: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  relevanceScore: number;
  relevanceLevel: RelevanceLevel;
  topics: RegulatoryTopic[];
  recommendedAction: string | null;
  reviewStatus: ReviewStatus;
  internalNote: string | null;
};

export type RegulatoryItemHistory = {
  id: string;
  itemId: string;
  changedAt: string;
  changeReason: string | null;
  snapshot: Record<string, unknown>;
};

export type RegelovervagningOverblik = {
  nySidenSidsteImport: number;
  højRelevans: number;
  senesteRetsinformation: RegulatoryItem[];
  senesteStps: RegulatoryItem[];
  emneFordeling: { emne: RegulatoryTopic; antal: number }[];
  senesteImport: { source: RegulatorySource; kørtKl: string | null; ok: boolean }[];
};
