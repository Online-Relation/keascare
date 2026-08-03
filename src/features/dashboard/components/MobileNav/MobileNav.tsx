// src/features/dashboard/components/MobileNav/MobileNav.tsx

'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, LayoutDashboard, ClipboardList,
  BarChart2, Settings, FileText, RefreshCw, Search, ArrowLeft, Star, Megaphone, Calendar, Target, LogOut, Building2, ChevronDown, ChevronRight, Activity, ShieldCheck, Scale, Newspaper, UserCheck, Package, Timer, Map, Users,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { DatoVælger } from '@/features/dashboard/components/DatoVælger';
import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';
import { UserAvatar } from '@/features/auth/components/UserAvatar';
import { TidsregistreringWidget } from '@/features/tidsregistrering/components/TidsregistreringWidget';

type BostedResultat = {
  id: string;
  navn: string;
  kommune: string | null;
  fundNiveau: string | null;
};

type KommuneResultat = {
  navn: string;
  slug: string;
};

type InspektoerResultat = {
  slug: string;
  navn: string;
  titel: string | null;
  antal: number;
};

type MobilResultater = {
  kommuner: KommuneResultat[];
  bosteder: BostedResultat[];
  inspektoerer: InspektoerResultat[];
};

export function MobileNav() {
  const [menuÅben, setMenuÅben] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [markedsforingÅben, setMarkedsforingÅben] = useState(
    pathname.startsWith('/dashboard/markedsforing'),
  );
  const [regelovervagningÅben, setRegelovervagningÅben] = useState(
    pathname.startsWith('/dashboard/regelovervagning'),
  );

  const [søgningÅben, setSøgningÅben] = useState(false);
  const [datoÅben, setDatoÅben] = useState(false);
  const [brugerNavn, setBrugerNavn] = useState('');
  const [brugerEmail, setBrugerEmail] = useState('');
  const [rolle, setRolle] = useState<string | null>(null);
  const [søgeTekst, setSøgeTekst] = useState('');
  const [resultater, setResultater] = useState<MobilResultater>({ kommuner: [], bosteder: [], inspektoerer: [] });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = getSupabaseAuthBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setBrugerNavn(user.user_metadata?.navn ?? '');
      setBrugerEmail(user.email ?? '');
      setRolle(user.user_metadata?.rolle ?? null);
    });
  }, []);

  useEffect(() => {
    if (søgningÅben) inputRef.current?.focus();
  }, [søgningÅben]);

  useEffect(() => {
    if (!søgeTekst.trim() || søgeTekst.length < 2) {
      setResultater({ kommuner: [], bosteder: [], inspektoerer: [] });
      return;
    }
    const t = setTimeout(async () => {
      const q = encodeURIComponent(søgeTekst);
      const [bRes, iRes, kRes] = await Promise.all([
        fetch(`/api/search/bosteder?q=${q}`),
        fetch(`/api/search/inspektoerer?q=${q}`),
        fetch(`/api/search/kommuner?q=${q}`),
      ]);
      const [bosteder, inspektoerer, kommuner] = await Promise.all([bRes.json(), iRes.json(), kRes.json()]);
      setResultater({ kommuner, bosteder, inspektoerer });
    }, 280);
    return () => clearTimeout(t);
  }, [søgeTekst]);

  function lukMenu() { setMenuÅben(false); }

  function lukSøgning() {
    setSøgningÅben(false);
    setSøgeTekst('');
    setResultater({ kommuner: [], bosteder: [], inspektoerer: [] });
  }

  function vælgBosted(id: string) {
    lukSøgning();
    router.push(`/dashboard/bosteder/${id}`);
  }

  function vælgKommune(slug: string) {
    lukSøgning();
    router.push(`/dashboard/kommuner/${slug}`);
  }

  function vælgInspektoer(slug: string) {
    lukSøgning();
    router.push(`/dashboard/rapporter/inspektoerer/${slug}`);
  }

  async function logUd() {
    const supabase = getSupabaseAuthBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`sidebar-nav-item${isActive ? ' active' : ''}`}
        onClick={lukMenu}
      >
        <Icon className="sidebar-nav-item-icon" size={16} />
        {label}
      </Link>
    );
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

      {!søgningÅben && (
        <div className="mobil-tr-bar">
          <TidsregistreringWidget />
        </div>
      )}

      {søgningÅben && (resultater.kommuner.length > 0 || resultater.bosteder.length > 0 || resultater.inspektoerer.length > 0) && (
        <div className="mobil-søg-resultater">
          {resultater.bosteder.length > 0 && (
            <>
              <p className="mobil-søg-sektion">Bosteder</p>
              {resultater.bosteder.map((r) => (
                <button key={r.id} className="mobil-søg-resultat" onClick={() => vælgBosted(r.id)}>
                  <span className="mobil-søg-navn">{r.navn}</span>
                  {r.kommune && <span className="mobil-søg-kommune">{r.kommune}</span>}
                </button>
              ))}
            </>
          )}
          {resultater.inspektoerer.length > 0 && (
            <>
              <p className="mobil-søg-sektion">Inspektører</p>
              {resultater.inspektoerer.map((r) => (
                <button key={r.slug} className="mobil-søg-resultat" onClick={() => vælgInspektoer(r.slug)}>
                  <span className="mobil-søg-navn">{r.navn}</span>
                  {r.titel && <span className="mobil-søg-kommune">{r.titel}</span>}
                </button>
              ))}
            </>
          )}
          {resultater.kommuner.length > 0 && (
            <>
              <p className="mobil-søg-sektion">Kommuner</p>
              {resultater.kommuner.map((r) => (
                <button key={r.slug} className="mobil-søg-resultat" onClick={() => vælgKommune(r.slug)}>
                  <span className="mobil-søg-navn">📍 {r.navn.replace(/\s+[Kk]ommune$/, '')} Kommune</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {menuÅben && <div className="mobil-overlay" onClick={lukMenu} />}
      {datoÅben && <div className="mobil-overlay" onClick={() => setDatoÅben(false)} />}

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
          <button className="mobil-hamburger" onClick={lukMenu} aria-label="Luk menu">
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Overblik */}
          <div className="sidebar-nav-gruppe-sektion">
            <p className="sidebar-section-label">Overblik</p>
            <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          </div>

          {/* Marked */}
          <div className="sidebar-nav-gruppe-sektion">
            <p className="sidebar-section-label">Marked</p>
            <NavLink href="/dashboard/markedspotentiale" icon={Target} label="Markedspotentiale" />
            <NavLink href="/dashboard/markedsdata" icon={BarChart2} label="Markedsdata" />
            <NavLink href="/dashboard/kort" icon={Map} label="Bosteder på kort" />
          </div>

          {/* Tilsyn */}
          <div className="sidebar-nav-gruppe-sektion">
            <p className="sidebar-section-label">Tilsyn</p>
            <NavLink href="/dashboard/rapporter" icon={ClipboardList} label="Kritiske rapporter" />
            <NavLink href="/dashboard/alle-rapporter" icon={FileText} label="Alle rapporter" />
            <NavLink href="/dashboard/rapporter/inspektoerer" icon={UserCheck} label="STPS-inspektører" />
          </div>

          {/* CRM */}
          <div className="sidebar-nav-gruppe-sektion">
            <p className="sidebar-section-label">CRM</p>
            <NavLink href="/dashboard/kunder" icon={Building2} label="Kunder" />
            <NavLink href="/dashboard/produkter" icon={Package} label="Produkter" />
            <NavLink href="/dashboard/tidsregistrering" icon={Timer} label="Tidsregistrering" />
            <NavLink href="/dashboard/pakker" icon={Package} label="Pakker" />
          </div>

          {/* Markedsføring — collapsible */}
          <div className="sidebar-nav-gruppe-sektion">
            <p className="sidebar-section-label">Markedsføring</p>
            <button
              className={`sidebar-nav-item sidebar-nav-gruppe${pathname.startsWith('/dashboard/markedsforing') ? ' active' : ''}`}
              onClick={() => setMarkedsforingÅben((v) => !v)}
            >
              <Megaphone className="sidebar-nav-item-icon" size={16} />
              <span style={{ flex: 1, textAlign: 'left' }}>Kanaler</span>
              {markedsforingÅben ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {markedsforingÅben && (
              <div className="sidebar-subnav">
                {[
                  { label: 'Meta',       href: '/dashboard/markedsforing/meta' },
                  { label: 'Google Ads', href: '/dashboard/markedsforing/google' },
                  { label: 'LinkedIn',   href: '/dashboard/markedsforing/linkedin' },
                ].map(({ label, href }) => (
                  <Link key={href} href={href} className={`sidebar-subnav-item${pathname === href ? ' active' : ''}`} onClick={lukMenu}>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Regelovervågning — collapsible */}
          <div className="sidebar-nav-gruppe-sektion">
            <p className="sidebar-section-label">Regelovervågning</p>
            <button
              className={`sidebar-nav-item sidebar-nav-gruppe${pathname.startsWith('/dashboard/regelovervagning') ? ' active' : ''}`}
              onClick={() => setRegelovervagningÅben((v) => !v)}
            >
              <ShieldCheck className="sidebar-nav-item-icon" size={16} />
              <span style={{ flex: 1, textAlign: 'left' }}>Regelovervågning</span>
              {regelovervagningÅben ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {regelovervagningÅben && (
              <div className="sidebar-subnav">
                {[
                  { label: 'Overblik',        href: '/dashboard/regelovervagning' },
                  { label: 'Retsinformation', href: '/dashboard/regelovervagning/retsinformation' },
                  { label: 'STPS-nyheder',   href: '/dashboard/regelovervagning/stps-nyheder' },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`sidebar-subnav-item${pathname === href || (href !== '/dashboard/regelovervagning' && pathname.startsWith(href)) ? ' active' : ''}`}
                    onClick={lukMenu}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* System */}
          <div className="sidebar-nav-gruppe-sektion">
            <p className="sidebar-section-label">System</p>
            <NavLink href="/dashboard/monitor" icon={Activity} label="Live Monitor" />
            <NavLink href="/dashboard/systemstatus" icon={Activity} label="Systemstatus" />
            <NavLink href="/dashboard/scrapers" icon={RefreshCw} label="Scrapers" />
            <NavLink href="/dashboard/indstillinger" icon={Settings} label="Indstillinger" />
            <NavLink href="/dashboard/admin/brugere" icon={Users} label="Brugere" />
            <NavLink href="/dashboard/monday-test" icon={Settings} label="Monday test" />
          </div>
        </div>

        <Link href="/dashboard/profil" className="sidebar-footer" onClick={lukMenu}>
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
