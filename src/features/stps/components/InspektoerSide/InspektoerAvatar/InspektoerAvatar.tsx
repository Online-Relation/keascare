'use client';

// src/features/stps/components/InspektoerSide/InspektoerAvatar/InspektoerAvatar.tsx

import { useEffect, useState } from 'react';

type Props = { navn: string; slug: string; size?: number };

function initialer(navn: string): string {
  return navn.split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase();
}

const FARVER = [
  '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#0d9488', '#b45309', '#1d4ed8',
];

function farveFraSlug(slug: string): string {
  let hash = 0;
  for (const c of slug) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return FARVER[Math.abs(hash) % FARVER.length];
}

export function InspektoerAvatar({ navn, slug, size = 40 }: Props) {
  const [url, setUrl] = useState<string | null | 'indlæser'>('indlæser');
  const farve = farveFraSlug(slug);
  const font  = Math.round(size * 0.35);

  useEffect(() => {
    let aktiv = true;
    fetch(`/api/inspektoerer/billede?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => { if (aktiv) setUrl(d.url ?? null); })
      .catch(() => { if (aktiv) setUrl(null); });
    return () => { aktiv = false; };
  }, [slug]);

  if (url && url !== 'indlæser') {
    return (
      <img
        src={url}
        alt={navn}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        onError={() => setUrl(null)}
      />
    );
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: url === 'indlæser' ? 'var(--color-border)' : farve,
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: font, fontWeight: 700, flexShrink: 0,
      }}
    >
      {url !== 'indlæser' && initialer(navn)}
    </div>
  );
}
