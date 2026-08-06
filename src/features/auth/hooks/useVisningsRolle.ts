'use client';

// src/features/auth/hooks/useVisningsRolle.ts
//
// Rent visuelt rolle-overlay til sidebaren — bruges når en bruger skal dele
// skærm og ikke vil vise menupunkter deres egen rolle har adgang til, men
// som andre i mødet ikke bør se. Ændrer IKKE brugerens faktiske rolle,
// rettigheder eller nogen data — kun hvilke menupunkter der vises i denne
// fane. Gemmes i sessionStorage: forsvinder automatisk ved log ud, lukket
// fane eller ny fane, så det ikke kan glemmes stående.

import { useCallback, useEffect, useState } from 'react';
import type { BrugerRolle } from '@/features/auth/config/roller.config';

const SESSION_NØGLE = 'keascare-vis-som';

export function useVisningsRolle() {
  const [visningRolle, setVisningRolleState] = useState<BrugerRolle | null>(null);

  // Starter altid som null (matcher server-renderet HTML) og læser først
  // sessionStorage EFTER mount, for at undgå hydration-mismatch — sessionStorage
  // findes kun i browseren, ikke under server-rendering.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- læser bevidst en browser-only kilde efter mount for at undgå hydration-mismatch
    setVisningRolleState(sessionStorage.getItem(SESSION_NØGLE) as BrugerRolle | null);
  }, []);

  const sætVisningRolle = useCallback((rolle: BrugerRolle | null) => {
    setVisningRolleState(rolle);
    if (rolle) sessionStorage.setItem(SESSION_NØGLE, rolle);
    else sessionStorage.removeItem(SESSION_NØGLE);
  }, []);

  const nulstil = useCallback(() => {
    setVisningRolleState(null);
    sessionStorage.removeItem(SESSION_NØGLE);
  }, []);

  return { visningRolle, sætVisningRolle, nulstil };
}
