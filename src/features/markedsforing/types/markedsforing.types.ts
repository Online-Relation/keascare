// src/features/markedsforing/types/markedsforing.types.ts

export type DagligDatapunkt = {
  dato: string;      // "01 jun"
  forbrug: number;   // kr.
  leads: number;
  klik: number;
  visninger: number;
};

export type KampagneRække = {
  navn: string;
  forbrug: number;
  leads: number;
  klik: number;
  cpl: number;
};

export type MetrikKortData = {
  label: string;
  værdi: string;
  underværdi?: string;
  tendens: 'op' | 'ned' | 'neutral';
  tendensProc: string;
  forklaring: string;
};

export type FordelingSegment = {
  navn: string;
  værdi: number;
  farve: string;
};
