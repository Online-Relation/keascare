// src/lib/business/MondayKundeRegler/mondayKundeRegler.ts
//
// ÉN fælles kilde til reglen om hvornår et bosted regnes som "allerede
// kunde" og derfor IKKE er et markedssignal. Bruges af alle sider der
// viser bosteder ud fra STPS-rapporter (dashboard, kritiske rapporter,
// markedsdata) — skal reglen ændres (fx hvornår en tabt kunde igen bliver
// et signal), rettes den KUN her.

export type MondayKundeStatus = 'kunde' | 'tabt' | 'ingen';

/**
 * Beregner et bosteds Monday-status ud fra rå felter fra stps_rapporter.
 * - 'kunde': aktivt matchet som kunde i Monday
 * - 'tabt':  tidligere matchet, men i "tabt"-gruppen — reelt tilbage på markedet
 * - 'ingen': aldrig matchet
 */
export function beregnMondayKundeStatus(
  mondayItemId: string | null | undefined,
  mondayGruppe: string | null | undefined,
): MondayKundeStatus {
  if (!mondayItemId) return 'ingen';
  return mondayGruppe === 'tabt' ? 'tabt' : 'kunde';
}

/**
 * Kernereglen for markedssignal-lister: et bosted er et markedssignal
 * medmindre det er en AKTIV kunde i Monday. Tabte kunder er stadig et
 * signal, da de reelt er tilbage på markedet.
 */
export function erMarkedssignal(
  mondayItemId: string | null | undefined,
  mondayGruppe: string | null | undefined,
): boolean {
  return beregnMondayKundeStatus(mondayItemId, mondayGruppe) !== 'kunde';
}
