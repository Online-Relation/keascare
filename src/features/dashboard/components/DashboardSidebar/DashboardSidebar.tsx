'use client';

// src/features/dashboard/components/DashboardSidebar/DashboardSidebar.tsx

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, ClipboardList, BarChart2, Settings,
  FileText, RefreshCw, Megaphone, ChevronDown, ChevronRight,
  Users, Building2, Target, Activity, FlaskConical, ShieldCheck, Scale, Newspaper, UserCheck, Package, Timer, Map, Bot,
} from 'lucide-react';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import { useVisningsRolle } from '@/features/auth/hooks/useVisningsRolle';
import { ProfilMenu } from '@/features/auth/components/ProfilMenu';
import { harDynamiskAdgang } from '@/features/auth/config/roller.config';
import { NAV_GRUPPER } from '@/features/dashboard/config/NavigationConfig/navigation.config';
import { useRolleRettigheder } from '@/features/auth/components/RolleRettighederProvider';

type NavItem = { label: string; href: string; icon: React.ElementType };

// Ikoner holdes udelukkende her (navigation.config.ts må ikke afhænge af lucide-react).
// Nyt menupunkt tilføjes i navigation.config.ts — tilføj blot dets ikon her ved siden af.
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

const gruppeMarkedsforing = [
  { label: 'Meta',       href: '/dashboard/markedsforing/meta' },
  { label: 'Google Ads', href: '/dashboard/markedsforing/google' },
  { label: 'LinkedIn',   href: '/dashboard/markedsforing/linkedin' },
];

const gruppeRegelovervagning: NavItem[] = [
  { label: 'Overblik',        href: '/dashboard/regelovervagning',                icon: ShieldCheck },
  { label: 'Retsinformation', href: '/dashboard/regelovervagning/retsinformation', icon: Scale },
  { label: 'STPS-nyheder',   href: '/dashboard/regelovervagning/stps-nyheder',    icon: Newspaper },
];

function NavGruppe({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="sidebar-nav-gruppe-sektion">
      <p className="sidebar-section-label">{label}</p>
      {items.map(({ label: l, href, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link key={href + l} href={href} className={`sidebar-nav-item${isActive ? ' active' : ''}`}>
            <Icon className="sidebar-nav-item-icon" size={16} />
            {l}
          </Link>
        );
      })}
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { rolle, loading } = useBrugerRolle();
  const { visningRolle } = useVisningsRolle();
  const erMarkedsforingAktiv = pathname.startsWith('/dashboard/markedsforing');
  const [markedsforingÅben, setMarkedsforingÅben] = useState(erMarkedsforingAktiv);
  const erRegelovervagningAktiv = pathname.startsWith('/dashboard/regelovervagning');
  const [regelovervagningÅben, setRegelovervagningÅben] = useState(erRegelovervagningAktiv);

  // Rent visuel overlay — påvirker kun hvilke menupunkter der vises i denne
  // fane, aldrig faktiske rettigheder eller data.
  const effektivRolle = visningRolle ?? rolle;

  const { rettigheder: dbRettigheder, loading: rettighederLoading } = useRolleRettigheder();
  const vis = (href: string) => !loading && !rettighederLoading && harDynamiskAdgang(effektivRolle, href, dbRettigheder);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Image
          src="/images/logo/logo.webp"
          alt="KeasCare"
          width={130}
          height={40}
          style={{ objectFit: 'contain', maxHeight: '40px', width: 'auto' }}
          priority
        />
      </div>

      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {vis('/dashboard') && (
          <NavGruppe label="Overblik" items={gruppeOverblik} pathname={pathname} />
        )}

        {gruppeMarked.some((i) => vis(i.href)) && (
          <NavGruppe
            label="Marked"
            items={gruppeMarked.filter((i) => vis(i.href))}
            pathname={pathname}
          />
        )}

        {gruppeTilsyn.some((i) => vis(i.href)) && (
          <NavGruppe
            label="Tilsyn"
            items={gruppeTilsyn.filter((i) => vis(i.href))}
            pathname={pathname}
          />
        )}

        {gruppeCrm.some((i) => vis(i.href)) && (
          <NavGruppe
            label="CRM"
            items={gruppeCrm.filter((i) => vis(i.href))}
            pathname={pathname}
          />
        )}

        {vis('/dashboard/markedsforing') && (
          <div className="sidebar-nav-gruppe-sektion">
            <p className="sidebar-section-label">Markedsføring</p>
            <button
              className={`sidebar-nav-item sidebar-nav-gruppe${erMarkedsforingAktiv ? ' active' : ''}`}
              onClick={() => setMarkedsforingÅben((v) => !v)}
            >
              <Megaphone className="sidebar-nav-item-icon" size={16} />
              <span style={{ flex: 1, textAlign: 'left' }}>Kanaler</span>
              {markedsforingÅben ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {markedsforingÅben && (
              <div className="sidebar-subnav">
                {gruppeMarkedsforing.map(({ label, href }) => (
                  <Link key={href} href={href} className={`sidebar-subnav-item${pathname === href ? ' active' : ''}`}>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {vis('/dashboard/regelovervagning') && (
          <div className="sidebar-nav-gruppe-sektion">
            <p className="sidebar-section-label">Regelovervågning</p>
            <button
              className={`sidebar-nav-item sidebar-nav-gruppe${erRegelovervagningAktiv ? ' active' : ''}`}
              onClick={() => setRegelovervagningÅben((v) => !v)}
            >
              <ShieldCheck className="sidebar-nav-item-icon" size={16} />
              <span style={{ flex: 1, textAlign: 'left' }}>Regelovervågning</span>
              {regelovervagningÅben ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {regelovervagningÅben && (
              <div className="sidebar-subnav">
                {gruppeRegelovervagning.map(({ label, href }) => (
                  <Link key={href} href={href} className={`sidebar-subnav-item${pathname === href || (href !== '/dashboard/regelovervagning' && pathname.startsWith(href)) ? ' active' : ''}`}>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}


        {gruppeSystem.some((i) => vis(i.href)) && (
          <NavGruppe
            label="System"
            items={gruppeSystem.filter((i) => vis(i.href))}
            pathname={pathname}
          />
        )}
      </nav>

      <ProfilMenu variant="sidebar" />
    </aside>
  );
}
