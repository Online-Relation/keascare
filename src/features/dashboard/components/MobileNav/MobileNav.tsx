// src/features/dashboard/components/MobileNav/MobileNav.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, LayoutDashboard, ClipboardList,
  TrendingUp, BarChart2, Settings, FileText, RefreshCw, Search, ArrowLeft, Star, MapPin,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',        href: '/dashboard',                  icon: LayoutDashboard },
  { label: 'Markedssignaler',  href: '/dashboard/markedssignaler',  icon: TrendingUp },
  { label: 'Tilsynsrapporter', href: '/dashboard/tilsynsrapporter', icon: ClipboardList },
  { label: 'Kommuner',         href: '/dashboard/kommuner',         icon: MapPin },
  { label: 'Rapporter',        href: '/dashboard/rapporter',        icon: FileText },
  { label: 'Markedsdata',      href: '/dashboard/markedsdata',      icon: BarChart2 },
  { label: 'Scrapers',         href: '/dashboard/scrapers',         icon: RefreshCw },
  { label: 'Indstillinger',    href: '/dashboard/indstillinger',    icon: Settings },
];

type Søgeresultat = {
  id: string;
  navn: string;
  kommune: string | null;
  fundNiveau: string | null;
};

export function MobileNav() {
  const [menuÅben, setMenuÅben] = useState(false);
  const [søgningÅben, setSøgningÅben] = useState(false);
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

      <nav className={`mobil-drawer${menuÅben ? ' åben' : ''}`}>
        <div className="mobil-drawer-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">KC</div>
            KeasCare
          </div>
          <button className="mobil-hamburger" onClick={() => setMenuÅben(false)} aria-label="Luk menu">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section" style={{ flex: 1 }}>
          <p className="sidebar-section-label">Navigation</p>
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-item${pathname === href ? ' active' : ''}`}
              onClick={() => setMenuÅben(false)}
            >
              <Icon className="sidebar-nav-item-icon" size={16} />
              {label}
            </Link>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">MK</div>
          <div>
            <p className="sidebar-user-name">Mads Kristensen</p>
            <p className="sidebar-user-role">Administrator</p>
          </div>
        </div>
      </nav>
    </>
  );
}
