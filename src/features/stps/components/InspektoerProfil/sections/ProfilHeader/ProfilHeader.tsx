'use client';

// src/features/stps/components/InspektoerProfil/sections/ProfilHeader/ProfilHeader.tsx

import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import { InspektoerAvatar } from '../../InspektoerAvatar';
import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoer: InspektoerFuldStat };

function formatDato(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ProfilHeader({ inspektoer: ins }: Props) {
  const router = useRouter();

  async function uploadBillede(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0];
    if (!fil) return;
    const fd = new FormData();
    fd.append('slug', ins.slug);
    fd.append('billede', fil);
    const res = await fetch('/api/inspektoerer/upload-billede', { method: 'POST', body: fd });
    const json = await res.json().catch(() => ({}));
    if (res.ok) window.location.reload();
    else alert('Upload fejlede: ' + (json.fejl ?? res.statusText));
  }

  return (
    <div className="profil-header">
      <button className="profil-tilbage" onClick={() => router.push('/dashboard/rapporter/inspektoerer')}>
        <ArrowLeft size={15} /> Alle inspektører
      </button>

      <div className="profil-header-kort">
        <div className="profil-avatar-wrap">
          <InspektoerAvatar navn={ins.navn} slug={ins.slug} size={72} />
          <label className="profil-upload-knap" title="Upload profilbillede">
            <Upload size={12} />
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadBillede} style={{ display: 'none' }} />
          </label>
        </div>
        <div className="profil-header-info">
          <h1 className="profil-navn">{ins.navn}</h1>
          <p className="profil-titel">{ins.titel ?? 'Stilling ikke angivet'}</p>
          <div className="profil-meta-grid">
            <span className="profil-meta-punkt"><strong>{ins.antal}</strong> tilsyn i alt</span>
            <span className="profil-meta-punkt"><strong>{ins.bosteder.length}</strong> unikke bosteder</span>
            <span className="profil-meta-punkt"><strong>{ins.kommuner.length}</strong> kommuner</span>
            <span className="profil-meta-punkt">Første tilsyn {formatDato(ins.foersteDato)}</span>
            <span className="profil-meta-punkt">Seneste tilsyn {formatDato(ins.senesteDato)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
