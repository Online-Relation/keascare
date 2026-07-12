'use client';

// src/features/dashboard/components/DashboardSidebar/DashboardSidebar.tsx

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, ClipboardList, BarChart2, Settings,
  FileText, RefreshCw, MapPin, Megaphone, ChevronDown, ChevronRight,
  Users, LogOut, Building2, Target, Activity, FlaskConical,
} from 'lucide-react';
import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/features/auth/components/UserAvatar';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';
import { harAdgang, ROLLE_LABELS } from '@/features/auth/config/roller.config';

type NavItem = { label: string; href: string; icon: React.ElementType };

const gruppeOverblik: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

const gruppeMarked: NavItem[] = [
  { label: 'Markedspotentiale', href: '/dashboard/markedspotentiale', icon: Target },
  { label: 'Kommuner',          href: '/dashboard/kommuner',          icon: MapPin },
  { label: 'Markedsdata',       href: '/dashboard/markedsdata',       icon: BarChart2 },
];

const gruppeTilsyn: NavItem[] = [
  { label: 'Kritiske rapporter', href: '/dashboard/rapporter',    icon: ClipboardList },
  { label: 'Alle rapporter',   href: '/dashboard/alle-rapporter', icon: FileText },
];

const gruppeCrm: NavItem[] = [
  { label: 'Kunder', href: '/dashboard/kunder', icon: Building2 },
];

const gruppeMarkedsforing = [
  { label: 'Meta',       href: '/dashboard/markedsforing/meta' },
  { label: 'Google Ads', href: '/dashboard/markedsforing/google' },
  { label: 'LinkedIn',   href: '/dashboard/markedsforing/linkedin' },
];

const gruppeSystem: NavItem[] = [
  { label: 'Live Monitor',  href: '/dashboard/monitor',          icon: Activity },
  { label: 'Systemstatus',  href: '/dashboard/systemstatus',     icon: BarChart2 },
  { label: 'Scrapers',      href: '/dashboard/scrapers',         icon: RefreshCw },
  { label: 'Monday test',   href: '/dashboard/monday-test',      icon: FlaskConical },
  { label: 'Indstillinger', href: '/dashboard/indstillinger',    icon: Settings },
  { label: 'Brugere',       href: '/dashboard/admin/brugere',    icon: Users },
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
  const router = useRouter();
  const { rolle, loading } = useBrugerRolle();
  const erMarkedsforingAktiv = pathname.startsWith('/dashboard/markedsforing');
  const [markedsforingÅben, setMarkedsforingÅben] = useState(erMarkedsforingAktiv);

  const vis = (href: string) => !loading && harAdgang(rolle, href);

  async function logUd() {
    const supabase = getSupabaseAuthBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

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

        {vis('/dashboard/kunder') && (
          <NavGruppe label="CRM" items={gruppeCrm} pathname={pathname} />
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

        {gruppeSystem.some((i) => vis(i.href)) && (
          <NavGruppe
            label="System"
            items={gruppeSystem.filter((i) => vis(i.href))}
            pathname={pathname}
          />
        )}
      </nav>

      <Link href="/dashboard/profil" className="sidebar-footer">
        <UserAvatar size={32} fontSize="0.7rem" />
        <div style={{ flex: 1 }}>
          <p className="sidebar-user-name">Min profil</p>
          <p className="sidebar-user-role">{rolle ? ROLLE_LABELS[rolle] : 'Klik for at redigere'}</p>
        </div>
        <button className="sidebar-logud-knap" onClick={(e) => { e.preventDefault(); logUd(); }} title="Log ud">
          <LogOut size={15} />
        </button>
      </Link>
    </aside>
  );
}
