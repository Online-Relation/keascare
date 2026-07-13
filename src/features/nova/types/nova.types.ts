// src/features/nova/types/nova.types.ts

export type NovaBeskedVariant = 'kritisk' | 'advarsel' | 'neutral' | 'succes';
export type NovaBeskedIkon = 'advarsel' | 'personer' | 'kalender' | 'stjerne';

export type NovaBesked = {
  id: string;
  titel: string;
  sub: string;
  variant: NovaBeskedVariant;
  ikon: NovaBeskedIkon;
};
