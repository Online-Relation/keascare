'use client';

import { useEffect, useState } from 'react';
import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';

type Props = {
  size?: number;
  fontSize?: string;
  className?: string;
};

export function UserAvatar({ size = 30, fontSize = '0.65rem', className = 'sidebar-avatar' }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initialer, setInitialer] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseAuthBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const navn = user.user_metadata?.navn ?? '';
      const email = user.email ?? '';
      const init = navn
        ? navn.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : email.slice(0, 2).toUpperCase();
      setInitialer(init);
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return <div style={{ width: size, height: size, flexShrink: 0 }} />;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Profilbillede"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <div className={className} style={{ width: size, height: size, fontSize, flexShrink: 0 }}>
      {initialer}
    </div>
  );
}
