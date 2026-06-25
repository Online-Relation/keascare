// src/features/dashboard/components/MobileNav/MobileNav.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, LayoutDashboard, ClipboardList,
  TrendingUp, BarChart2, Settings, FileText, RefreshCw,
} from 'lucide-react';
import { GlobalSearch } from '@/features/dashboard/components/GlobalSearch';

const navItems = [
  { label: 'Dashboard',        href: '/dashboard',                 icon: LayoutDashboard },
  { label: 'Markedssignaler',  href: '/dashboard/markedssignaler', icon: TrendingUp },
  { label: 'Tilsynsrapporter', href: '/dashboard/tilsynsrapporter', icon: ClipboardList },
  { label: 'Rapporter',        href: '/dashboard/rapporter',       icon: FileText },
  { label: 'Markedsdata',      href: '/dashboard/markedsdata',     icon: BarChart2 },
  { label: 'Scrapers',         href: '/dashboard/scrapers',        icon: RefreshCw },
  { label: 'Indstillinger',    href: '/dashboard/indstillinger',   icon: Settings },
];

export function MobileNav() {
  const [åben, setÅben] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="mobil-topbar">
        <button
          className="mobil-hamburger"
          onClick={() => setÅben(true)}
          aria-label="Åbn menu"
        >
          <Menu size={22} />
        </button>
        <div className="mobil-topbar-search">
          <GlobalSearch />
        </div>
      </header>

      {åben && (
        <div className="mobil-overlay" onClick={() => setÅben(false)} />
      )}

      <nav className={`mobil-drawer${åben ? ' åben' : ''}`}>
        <div className="mobil-drawer-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">KC</div>
            KeasCare
          </div>
          <button
            className="mobil-hamburger"
            onClick={() => setÅben(false)}
            aria-label="Luk menu"
          >
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
              onClick={() => setÅben(false)}
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
