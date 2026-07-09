// src/features/dashboard/components/MobileNav/MobileNav.tsx

'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, LayoutDashboard, ClipboardList,
  TrendingUp, BarChart2, Settings, FileText, RefreshCw, Search, ArrowLeft, Star, MapPin, Megaphone, Calendar, Target, LogOut, Building2, ChevronDown, ChevronRight, Activity,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { DatoVælger } from '@/features/dashboard/components/DatoVælger';
import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';
import { UserAvatar } from '@/features/auth/components/UserAvatar';

const navGrupper = [
  {
    label: 'Overblik',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Marked',
    items: [
      { label: 'Markedssignaler',   href: '/dashboard/markedspotentiale', icon: TrendingUp },
      { label: 'Markedspotentiale', href: '/dashboard/markedspotentiale', icon: Target },
      { label: 'Kommuner',          href: '/dashboard/kommuner',          icon: MapPin },
      { label: 'Markedsdata',       href: '/dashboard/markedsdata',       icon: BarChart2 },
    ],
  },
  {
    label: 'Tilsyn',
    items: [
      { label: 'Kritiske rapporter', href: '/dashboard/rapporter',      icon: ClipboardList },
      { label: 'Alle rapporter',   href: '/dashboard/alle-rapporter', icon: FileText },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Kunder', href: '/dashboard/kunder', icon: Building2 },
    ],
  },
  {
    label: 'Markedsføring',
    items: [
      { label: 'Meta',       href: '/dashboard/markedsforing/meta',     icon: Megaphone },
      { label: 'Google Ads', href: '/dashboard/markedsforing/google',   icon: Megaphone },
      { label: 'LinkedIn',   href: '/dashboard/markedsforing/linkedin', icon: Megaphone },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Systemstatus',  href: '/dashboard/systemstatus',   icon: Activity },
      { label: 'Scrapers',      href: '/dashboard/scrapers',       icon: RefreshCw },
      { label: 'Indstillinger', href: '/dashboard/indstillinger',  icon: Settings },
    ],
  },
];

type Søgeresultat = {
  id: string;
  navn: string;
  kommune: string | null;
  fundNiveau: string | null;
};

export function MobileNav() {
  const [menuÅben, setMenuÅben] = useState(false);
  const [markedsforingÅben, setMarkedsforingÅben] = useState(false);
  const [søgningÅben, setSøgningÅben] = useState(false);
  const [datoÅben, setDatoÅben] = useState(false);
  const [brugerNavn, setBrugerNavn] = useState('');
  const [brugerEmail, setBrugerEmail] = useState('');

  useEffect(() => {
    const supabase = getSupabaseAuthBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setBrugerNavn(user.user_metadata?.navn ?? '');
      setBrugerEmail(user.email ?? '');
    });
  }, []);

  async function logUd() {
    const supabase = getSupabaseAuthBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }
  const [søgeTekst, setSøgeTekst] = useState('');
  const [resultater, setResultater] = useState<Søgeresultat[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (søgningÅben) inputRef.current?.focus();
  }, [søgningÅben]);

  useEffect(() => {
    if (!søgeTekst.trim() || søgeTekst.length < 2) {
      setResultater([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search/bosteder?q=${encodeURIComponent(søgeTekst)}`);
      const data = await res.json();
      setResultater(data);
    }, 280);
    return () => clearTimeout(t);
  }, [søgeTekst]);

  function lukSøgning() {
    setSøgningÅben(false);
    setSøgeTekst('');
    setResultater([]);
  }

  function vælgResultat(id: string) {
    lukSøgning();
    router.push(`/dashboard/bosteder/${id}`);
  }

  return (
    <>
      <header className="mobil-topbar">
        {søgningÅben ? (
          <>
            <button className="mobil-hamburger" onClick={lukSøgning} aria-label="Luk søgning">
              <ArrowLeft size={22} />
            </button>
            <div className="mobil-søg-felt">
              <input
                ref={inputRef}
                className="mobil-søg-input"
                type="text"
                placeholder="Søg efter bosted..."
                value={søgeTekst}
                onChange={(e) => setSøgeTekst(e.target.value)}
              />
              {søgeTekst && (
                <button className="mobil-søg-ryd" onClick={() => setSøgeTekst('')} aria-label="Ryd">
                  <X size={16} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="mobil-hamburger" onClick={() => setMenuÅben(true)} aria-label="Åbn menu">
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Link href="/dashboard/favoritter" className="mobil-søg-ikon" aria-label="Fulgte bosteder">
                <Star size={20} />
              </Link>
              <button className="mobil-søg-ikon" onClick={() => setDatoÅben(true)} aria-label="Vælg periode">
                <Calendar size={20} />
              </button>
              <button className="mobil-søg-ikon" onClick={() => setSøgningÅben(true)} aria-label="Søg">
                <Search size={20} />
              </button>
            </div>
          </>
        )}
      </header>

      {søgningÅben && resultater.length > 0 && (
        <div className="mobil-søg-resultater">
          {resultater.map((r) => (
            <button key={r.id} className="mobil-søg-resultat" onClick={() => vælgResultat(r.id)}>
              <span className="mobil-søg-navn">{r.navn}</span>
              {r.kommune && <span className="mobil-søg-kommune">{r.kommune}</span>}
            </button>
          ))}
        </div>
      )}

      {menuÅben && (
        <div className="mobil-overlay" onClick={() => setMenuÅben(false)} />
      )}

      {datoÅben && (
        <div className="mobil-overlay" onClick={() => setDatoÅben(false)} />
      )}
      <div className={`dato-bottom-sheet${datoÅben ? ' åben' : ''}`}>
        <div className="dato-bottom-sheet-header">
          <span className="dato-bottom-sheet-titel">Vælg periode</span>
          <button className="mobil-hamburger" onClick={() => setDatoÅben(false)} aria-label="Luk">
            <X size={20} />
          </button>
        </div>
        <Suspense>
          <DatoVælger variant="mobil" onLuk={() => setDatoÅben(false)} />
        </Suspense>
      </div>

      <nav className={`mobil-drawer${menuÅben ? ' åben' : ''}`}>
        <div className="mobil-drawer-header">
          <div className="sidebar-logo">
            <Image
              src="/images/logo/logo.webp"
              alt="KeasCare"
              width={120}
              height={36}
              style={{ objectFit: 'contain', maxHeight: '36px', width: 'auto' }}
              priority
            />
          </div>
          <button className="mobil-hamburger" onClick={() => setMenuÅben(false)} aria-label="Luk menu">
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1 }}>
          {navGrupper.map((gruppe) => {
            const erMarkedsforing = gruppe.label === 'Markedsføring';
            return (
              <div key={gruppe.label} className="sidebar-nav-gruppe-sektion">
                {erMarkedsforing ? (
                  <>
                    <p className="sidebar-section-label">Markedsføring</p>
                    <button
                      className="sidebar-nav-item sidebar-nav-gruppe"
                      onClick={() => setMarkedsforingÅben((v) => !v)}
                    >
                      <Megaphone className="sidebar-nav-item-icon" size={16} />
                      <span style={{ flex: 1, textAlign: 'left' }}>Kanaler</span>
                      {markedsforingÅben ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {markedsforingÅben && (
                      <div className="sidebar-subnav">
                        {gruppe.items.map(({ label, href }) => (
                          <Link
                            key={href + label}
                            href={href}
                            className={`sidebar-subnav-item${pathname === href ? ' active' : ''}`}
                            onClick={() => setMenuÅben(false)}
                          >
                            {label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="sidebar-section-label">{gruppe.label}</p>
                    {gruppe.items.map(({ label, href, icon: Icon }) => {
                      const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                      return (
                        <Link
                          key={href + label}
                          href={href}
                          className={`sidebar-nav-item${isActive ? ' active' : ''}`}
                          onClick={() => setMenuÅben(false)}
                        >
                          <Icon className="sidebar-nav-item-icon" size={16} />
                          {label}
                        </Link>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <Link href="/dashboard/profil" className="sidebar-footer" onClick={() => setMenuÅben(false)}>
          <UserAvatar size={32} fontSize="0.7rem" />
          <div style={{ flex: 1 }}>
            <p className="sidebar-user-name">{brugerNavn || brugerEmail || 'Min profil'}</p>
            <p className="sidebar-user-role">Klik for at redigere</p>
          </div>
          <button
            className="sidebar-logud-knap"
            onClick={(e) => { e.preventDefault(); logUd(); }}
            title="Log ud"
          >
            <LogOut size={15} />
          </button>
        </Link>
      </nav>
    </>
  );
}
