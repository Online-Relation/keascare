'use client';

// src/features/stps/components/InspektoerSide/InspektoerAvatar/InspektoerAvatar.tsx

import { useState } from 'react';

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

const EXTS = ['jpg', 'png', 'webp'];
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const BUCKET = 'inspektoer-billeder';

function billedeUrl(slug: string, ext: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${slug}.${ext}`;
}

export function InspektoerAvatar({ navn, slug, size = 40 }: Props) {
  const [ekstIdx, setEktIdx] = useState(0);
  const farve = farveFraSlug(slug);
  const font  = Math.round(size * 0.35);

  if (ekstIdx < EXTS.length) {
    return (
      <img
        src={billedeUrl(slug, EXTS[ekstIdx])}
        alt={navn}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        onError={() => setEktIdx((i) => i + 1)}
      />
    );
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: farve, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: font, fontWeight: 700, flexShrink: 0,
      }}
    >
      {initialer(navn)}
    </div>
  );
}
