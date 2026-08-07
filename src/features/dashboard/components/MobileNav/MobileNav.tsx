// src/features/dashboard/components/MobileNav/MobileNav.tsx

'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, LayoutDashboard, ClipboardList,
  BarChart2, Settings, FileText, RefreshCw, Search, ArrowLeft, Star, Megaphone, Calendar, Target, Building2, ChevronDown, ChevronRight, Activity, ShieldCheck, Scale, Newspaper, UserCheck, Package, Timer, Map, Users, FlaskConical, Bot,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { DatoVælger } from '@/features/dashboard/components/DatoVælger';
import { TidsregistreringWidget } from '@/features/tidsregistrering/components/TidsregistreringWidget';
import { ProfilMenu } from '@/features/auth/components/ProfilMenu';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import { useVisningsRolle } from '@/features/auth/components/VisningsRolleProvider';
import { useRolleRettigheder } from '@/features/auth/components/RolleRettighederProvider';
import { harDynamiskAdgang } from '@/features/auth/config/roller.config';
import { NAV_GRUPPER } from '@/features/dashboard/config/NavigationConfig/navigation.config';

type NavItem = { label: string; href: string; icon: React.ElementType };

// Samme ikon-liste som DashboardSidebar — hold dem i sync ved nye menupunkter.
const IKON_FOR_HREF: Record<string, React.ElementType> = {
  '/dashboard':                        LayoutDashboard,
  '/dashboard/markedspotentiale':      Target,
  '/dashboard/markedsdata':            BarChart2,
  '/dashboard/kort':                   Map,
  '/dashboard/rapporter':              ClipboardList,
  '/dashboard/alle-rapporter':         FileText,
  '/dashboard/rapporter/inspektoerer': UserCheck,
  '/dashboard/kunder':                 Building2,
  '/dashboard/produkter':              Package,
  '/dashboard/tidsregistrering':       Timer,
  '/dashboard/pakker':                 Package,
  '/dashboard/nova':                   Bot,
  '/dashboard/monitor':                Activity,
  '/dashboard/systemstatus':           BarChart2,
  '/dashboard/scrapers':               RefreshCw,
  '/dashboard/monday-test':            FlaskConical,
  '/dashboard/indstillinger':          Settings,
  '/dashboard/admin/brugere':          Users,
};

function grupItems(gruppe: string): NavItem[] {
  return NAV_GRUPPER
    .filter((p) => p.gruppe === gruppe)
    .map((p) => ({ label: p.label, href: p.href, icon: IKON_FOR_HREF[p.href] ?? Settings }));
}

const gruppeOverblik = grupItems('Overblik');
const gruppeMarked = grupItems('Marked');
const gruppeTilsyn = grupItems('Tilsyn');
const gruppeCrm = grupItems('CRM');
const gruppeSystem = grupItems('System');

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
  const [søgeTekst, setSøgeTekst] = useState('');
  const [resultater, setResultater] = useState<MobilResultater>({ kommuner: [], bosteder: [], inspektoerer: [] });
  const inputRef = useRef<HTMLInputElement>(null);

  const { rolle, loading } = useBrugerRolle();
  const { visningRolle } = useVisningsRolle();
  const { rettigheder: dbRettigheder, loading: rettighederLoading } = useRolleRettigheder();
  // Rent visuel overlay — samme 'Vis som'-funktion som desktop-sidebaren.
  const effektivRolle = visningRolle ?? rolle;
  const vis = (href: string) => !loading && !rettighederLoading && harDynamiskAdgang(effektivRolle, href, dbRettigheder);

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
          {vis('/dashboard') && (
            <div className="sidebar-nav-gruppe-sektion">
              <p className="sidebar-section-label">Overblik</p>
              {gruppeOverblik.map((i) => (
                <NavLink key={i.href} href={i.href} icon={i.icon} label={i.label} />
              ))}
            </div>
          )}

          {/* Marked */}
          {gruppeMarked.some((i) => vis(i.href)) && (
            <div className="sidebar-nav-gruppe-sektion">
              <p className="sidebar-section-label">Marked</p>
              {gruppeMarked.filter((i) => vis(i.href)).map((i) => (
                <NavLink key={i.href} href={i.href} icon={i.icon} label={i.label} />
              ))}
            </div>
          )}

          {/* Tilsyn */}
          {gruppeTilsyn.some((i) => vis(i.href)) && (
            <div className="sidebar-nav-gruppe-sektion">
              <p className="sidebar-section-label">Tilsyn</p>
              {gruppeTilsyn.filter((i) => vis(i.href)).map((i) => (
                <NavLink key={i.href} href={i.href} icon={i.icon} label={i.label} />
              ))}
            </div>
          )}

          {/* CRM */}
          {gruppeCrm.some((i) => vis(i.href)) && (
            <div className="sidebar-nav-gruppe-sektion">
              <p className="sidebar-section-label">CRM</p>
              {gruppeCrm.filter((i) => vis(i.href)).map((i) => (
                <NavLink key={i.href} href={i.href} icon={i.icon} label={i.label} />
              ))}
            </div>
          )}

          {/* Markedsføring — collapsible */}
          {vis('/dashboard/markedsforing') && (
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
          )}

          {/* Regelovervågning — collapsible */}
          {vis('/dashboard/regelovervagning') && (
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
          )}

          {/* System */}
          {gruppeSystem.some((i) => vis(i.href)) && (
            <div className="sidebar-nav-gruppe-sektion">
              <p className="sidebar-section-label">System</p>
              {gruppeSystem.filter((i) => vis(i.href)).map((i) => (
                <NavLink key={i.href} href={i.href} icon={i.icon} label={i.label} />
              ))}
            </div>
          )}
        </div>

        <ProfilMenu variant="sidebar" />
      </nav>
    </>
  );
}
