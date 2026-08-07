'use client';

// src/features/auth/components/VisningsRolleProvider/VisningsRolleProvider.tsx
//
// Delt tilstand for det rent visuelle 'Vis som'-rolleoverlay. Skal være ÉN
// fælles kilde — ikke en almindelig hook med sin egen useState — ellers får
// ProfilMenu (som sætter valget) og DashboardSidebar (som filtrerer efter
// det) hver deres isolerede kopi, og sidebaren opdaterer aldrig når man
// vælger en rolle i menuen.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { BrugerRolle } from '@/features/auth/config/roller.config';

const SESSION_NØGLE = 'keascare-vis-som';

type VisningsRolleContextValue = {
  visningRolle: BrugerRolle | null;
  sætVisningRolle: (rolle: BrugerRolle | null) => void;
  nulstil: () => void;
};

const VisningsRolleContext = createContext<VisningsRolleContextValue>({
  visningRolle: null,
  sætVisningRolle: () => {},
  nulstil: () => {},
});

export function VisningsRolleProvider({ children }: { children: React.ReactNode }) {
  const [visningRolle, setVisningRolleState] = useState<BrugerRolle | null>(null);

  // Starter altid som null (matcher server-renderet HTML) og læser først
  // sessionStorage EFTER mount, for at undgå hydration-mismatch.
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

  return (
    <VisningsRolleContext.Provider value={{ visningRolle, sætVisningRolle, nulstil }}>
      {children}
    </VisningsRolleContext.Provider>
  );
}

export function useVisningsRolle(): VisningsRolleContextValue {
  return useContext(VisningsRolleContext);
}
