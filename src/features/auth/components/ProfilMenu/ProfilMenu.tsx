'use client';

// src/features/auth/components/ProfilMenu/ProfilMenu.tsx
//
// Delt profil-menu med det diskrete 'Vis som'-rolleoverlay til skærmdeling.
// Bruges to steder: sidebar-footeren (variant="sidebar") og topbar-avataren
// i øverste højre hjørne (variant="header") — samme logik, forskellig trigger.

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';
import { UserAvatar } from '@/features/auth/components/UserAvatar';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import { useVisningsRolle } from '@/features/auth/components/VisningsRolleProvider';
import { ROLLE_LABELS, type BrugerRolle } from '@/features/auth/config/roller.config';

type Props = { variant: 'sidebar' | 'header' };

const VIS_SOM_ROLLER: BrugerRolle[] = ['sygeplejerske', 'bostedsansvarlig', 'direktør'];

export function ProfilMenu({ variant }: Props) {
  const router = useRouter();
  const { rolle } = useBrugerRolle();
  const { visningRolle, sætVisningRolle, nulstil } = useVisningsRolle();
  const [åben, setÅben] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const effektivRolle = visningRolle ?? rolle;

  useEffect(() => {
    function lukVedKlikUdenfor(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setÅben(false);
    }
    if (åben) document.addEventListener('mousedown', lukVedKlikUdenfor);
    return () => document.removeEventListener('mousedown', lukVedKlikUdenfor);
  }, [åben]);

  async function logUd() {
    nulstil();
    const supabase = getSupabaseAuthBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  // development ser alle tre roller (har ingen af dem selv); andre roller
  // ser de to øvrige (minus egen rolle).
  const visSomRoller = rolle === 'development'
    ? VIS_SOM_ROLLER
    : VIS_SOM_ROLLER.filter((r) => r !== rolle);

  return (
    <div className={`profil-menu-wrapper profil-menu-wrapper--${variant}`} ref={wrapperRef}>
      {åben && (
        <div className="profil-menu-popover">
          <Link href="/dashboard/profil" className="profil-menu-item" onClick={() => setÅben(false)}>
            Min profil
          </Link>
          {rolle && visSomRoller.length > 0 && (
            <>
              <div className="profil-menu-deler" />
              <p className="profil-menu-label">Vis som</p>
              {visSomRoller.map((r) => (
                <button
                  key={r}
                  className={`profil-menu-item${visningRolle === r ? ' profil-menu-item--aktiv' : ''}`}
                  onClick={() => sætVisningRolle(visningRolle === r ? null : r)}
                >
                  {ROLLE_LABELS[r]}
                </button>
              ))}
              {visningRolle && (
                <button className="profil-menu-item profil-menu-item--nulstil" onClick={() => sætVisningRolle(null)}>
                  Vis min egen adgang
                </button>
              )}
            </>
          )}
        </div>
      )}

      {variant === 'sidebar' ? (
        <button className="sidebar-footer" onClick={() => setÅben((v) => !v)}>
          <UserAvatar size={32} fontSize="0.7rem" />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p className="sidebar-user-name">Min profil</p>
            <p className="sidebar-user-role">{effektivRolle ? ROLLE_LABELS[effektivRolle] : 'Klik for at redigere'}</p>
          </div>
          <span className="sidebar-logud-knap" onClick={(e) => { e.stopPropagation(); logUd(); }} title="Log ud" role="button" tabIndex={0}>
            <LogOut size={15} />
          </span>
        </button>
      ) : (
        <button className="header-avatar-knap" onClick={() => setÅben((v) => !v)} aria-label="Min profil">
          <UserAvatar size={30} fontSize="0.65rem" />
        </button>
      )}
    </div>
  );
}
