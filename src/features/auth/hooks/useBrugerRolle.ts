'use client';

import { useEffect, useState } from 'react';
import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';
import type { BrugerRolle } from '@/features/auth/config/roller.config';

type BrugerInfo = {
  rolle: BrugerRolle | null;
  navn: string;
  email: string;
  loading: boolean;
};

export function useBrugerRolle(): BrugerInfo {
  const [info, setInfo] = useState<BrugerInfo>({ rolle: null, navn: '', email: '', loading: true });

  useEffect(() => {
    const supabase = getSupabaseAuthBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { setInfo({ rolle: null, navn: '', email: '', loading: false }); return; }
      setInfo({
        rolle:   (user.user_metadata?.rolle as BrugerRolle) ?? null,
        navn:    user.user_metadata?.navn ?? '',
        email:   user.email ?? '',
        loading: false,
      });
    });
  }, []);

  return info;
}
