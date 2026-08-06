'use client';
// src/features/auth/components/RolleRettighederProvider/RolleRettighederProvider.tsx
//
// Henter de DB-gemte rolle-rettigheder (fra /dashboard/admin/brugere → "Gem
// rettigheder") én gang og gør dem tilgængelige for hele appen. Sidebaren og
// adgangsoversigten bruger denne kontekst i stedet for kun den statiske
// ROLLE_ADGANG-liste, så "Gem rettigheder" reelt styrer hvad brugerne ser.

import { createContext, useContext, useEffect, useState } from 'react';
import type { BrugerRolle } from '@/features/auth/config/roller.config';

type RettighederMap = Partial<Record<BrugerRolle, string[]>>;

type RolleRettighederContextValue = {
  rettigheder: RettighederMap;
  loading: boolean;
};

const RolleRettighederContext = createContext<RolleRettighederContextValue>({
  rettigheder: {},
  loading: true,
});

export function RolleRettighederProvider({ children }: { children: React.ReactNode }) {
  const [rettigheder, setRettigheder] = useState<RettighederMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/rolle-rettigheder')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          const map: RettighederMap = {};
          for (const row of data.rettigheder as { rolle: BrugerRolle; stier: string[] }[]) {
            map[row.rolle] = row.stier;
          }
          setRettigheder(map);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <RolleRettighederContext.Provider value={{ rettigheder, loading }}>
      {children}
    </RolleRettighederContext.Provider>
  );
}

export function useRolleRettigheder(): RolleRettighederContextValue {
  return useContext(RolleRettighederContext);
}
