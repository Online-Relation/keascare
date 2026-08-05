// Oversætter email-adresser til visningsnavne for forløbsansvarlige

const EMAIL_TIL_NAVN: Record<string, string> = {
  'stine@keascare.dk':    'Stine Brænder',
  'stine.braender@keascare.dk': 'Stine Brænder',
};

export function formatForløbsansvarlig(værdi: string | null | undefined): string {
  if (!værdi) return '—';
  const norm = værdi.trim().toLowerCase();
  return EMAIL_TIL_NAVN[norm] ?? værdi.trim();
}
